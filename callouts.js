/* ============ pump.fun Callouts tracker ============ */
// pump.fun's Callout Rewards formula is unpublished and keeps changing, so this
// logs every call + each day's USDC payout, splits each day's payout across that
// day's calls, and surfaces which market-cap range pays best. Market cap at call
// and the 1h/4h price move are auto-filled from DexScreener (name, supply) +
// GeckoTerminal 5-minute candles, so a call can be logged after the fact.
// Follower PnL comes off the pump.fun Callouts page by hand.

let callouts = store.load("life.callouts", []);        // {id, ts, mint, name, symbol, held, mcCall, px1h, px4h, fol1h, fol4h}
let calloutPay = store.load("life.calloutPay", {});    // "YYYY-MM-DD" (day the calls were made) -> USDC

const CO_HOUR = 3600 * 1000;
const coDay = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const coUsd = n => n == null ? "—" : n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(1) + "K" : "$" + n.toFixed(0);
const coPct = n => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(Math.abs(n) < 10 ? 1 : 0) + "%";
const coCls = n => n == null ? "" : n >= 0 ? "up" : "down";

// accepts a bare mint or any pump.fun / dexscreener / axiom URL containing one
function parseMint(s) {
  const m = String(s || "").match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
  return m ? m.sort((a, b) => b.length - a.length)[0] : null;
}

async function coJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + " " + url);
  return r.json();
}

// GeckoTerminal allows ~30 req/min and its 429s carry no CORS header (they surface
// as "Failed to fetch"), so space requests out and retry once after a pause.
let geckoNext = 0;
async function geckoJson(url) {
  for (let attempt = 0; ; attempt++) {
    const wait = geckoNext - Date.now();
    geckoNext = Math.max(Date.now(), geckoNext) + 2200;
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    try { return await coJson(url); }
    catch (e) { if (attempt >= 1) throw e; geckoNext = Date.now() + 15000; }
  }
}

// fills name/symbol, mcCall, px1h, px4h (percent moves from the call price)
async function fetchCallData(c) {
  let supply = 1e9, mcNow = null, main = null;
  try {
    const ds = await coJson(`https://api.dexscreener.com/latest/dex/tokens/${c.mint}`);
    const p = (ds.pairs || []).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    if (p) {
      main = { addr: p.pairAddress, created: (p.pairCreatedAt || 0) / 1000 };
      c.name = p.baseToken?.name || c.name; c.symbol = p.baseToken?.symbol || c.symbol;
      mcNow = p.marketCap || p.fdv || null;
      if (mcNow && +p.priceUsd) supply = mcNow / +p.priceUsd;
    }
  } catch (e) { console.warn("dexscreener", e); }

  // 5-minute candles from the main (most liquid) pool. If that pool didn't exist yet
  // at call time — the coin migrated off the bonding curve after the call — the
  // earlier stretch comes from the pump.fun bonding-curve pool instead. Never mix
  // in other pools: thin copycat pools carry junk prices.
  const t0call = c.ts / 1000, before = Math.floor(t0call + 4 * 3600 + 600);
  const ohlcv = async addr => (await geckoJson(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${addr}/ohlcv/minute?aggregate=5&limit=60&currency=usd&token=${c.mint}&before_timestamp=${before}`)).data?.attributes?.ohlcv_list || [];
  let candles = [];
  try {
    if (!main || main.created > t0call - 300) {
      const pools = (await geckoJson(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${c.mint}/pools?page=1`)).data || [];
      const curve = pools.find(x => x.relationships?.dex?.data?.id === "pump-fun");
      if (!main && pools[0]) main = { addr: pools[0].attributes.address, created: Date.parse(pools[0].attributes.pool_created_at) / 1000 };
      if (curve && curve.attributes.address !== main?.addr) candles = (await ohlcv(curve.attributes.address)).filter(k => k[0] < main.created);
    }
    if (main) candles.push(...(await ohlcv(main.addr)).filter(k => k[0] >= main.created - 300));
  } catch (e) { console.warn("geckoterminal", e); }
  candles.sort((a, b) => a[0] - b[0]); // [t, open, high, low, close, vol]

  const t0 = c.ts / 1000;
  // no candle = no trades, so the price is still the last close
  const closeAt = t => { let k = null; for (const x of candles) if (x[0] <= t) k = x; return k ? k[4] : null; };
  let p0 = closeAt(t0);
  if (p0 == null) { const after = candles.find(x => x[0] >= t0 && x[0] - t0 < 15 * 60); if (after) p0 = after[1]; }
  if (p0 == null && Date.now() - c.ts < 10 * 60000 && mcNow) c.mcCall = mcNow; // just called: current MC is the call MC
  if (p0 != null) {
    c.mcCall = p0 * supply;
    const move = t => { const p = Date.now() / 1000 >= t ? closeAt(t) : null; return p == null ? null : (p / p0 - 1) * 100; };
    c.px1h = move(t0 + 3600);
    c.px4h = move(t0 + 4 * 3600);
  }
  c.fetched = Date.now();
}

const coPending = c => c.mcCall == null || c.px4h == null;

async function refreshCallouts(onlyPending = true) {
  const btn = document.getElementById("co-refresh");
  const todo = callouts.filter(c => !onlyPending || (coPending(c) && Date.now() - c.ts < 7 * 24 * CO_HOUR));
  if (btn) { btn.disabled = true; btn.textContent = `Updating ${todo.length}…`; }
  for (const c of todo) {
    try { await fetchCallData(c); } catch (e) { console.warn(e); }
    store.save("life.callouts", callouts);
    renderCallouts();
  }
  if (btn) { btn.disabled = false; btn.textContent = "↻ Update prices"; }
}

/* ----- analysis: spread each day's payout evenly across that day's calls ----- */
function coPerCall() {
  const perDay = {};
  for (const c of callouts) (perDay[coDay(c.ts)] ||= []).push(c);
  const rows = [];
  for (const [day, list] of Object.entries(perDay)) {
    if (!(day in calloutPay)) continue; // payout not logged yet — leave out of the analysis
    for (const c of list) rows.push({ c, pay: calloutPay[day] / list.length, nDay: list.length });
  }
  return rows;
}

const MC_BUCKETS = [["under $10K", 0, 1e4], ["$10K–100K", 1e4, 1e5], ["$100K–1M", 1e5, 1e6], ["over $1M", 1e6, Infinity]];

// market-cap range with the highest average payout per call (needs 3+ calls in a range to count)
function coBestRange(rows) {
  let best = null;
  for (const [label, lo, hi] of MC_BUCKETS) {
    const l = rows.filter(r => r.c.mcCall != null && r.c.mcCall >= lo && r.c.mcCall < hi);
    if (l.length < 3) continue;
    const avg = l.reduce((s, r) => s + r.pay, 0) / l.length;
    if (!best || avg > best.avg) best = { label, avg, n: l.length };
  }
  return best;
}

function renderCallouts() {
  const rows = coPerCall();
  const total = Object.values(calloutPay).reduce((s, v) => s + v, 0);
  document.getElementById("co-total").textContent = fmtMoney(total);
  document.getElementById("co-total-sub").textContent = `${Object.keys(calloutPay).length} payout days logged`;
  document.getElementById("co-count").textContent = callouts.length;
  const today = callouts.filter(c => coDay(c.ts) === todayStr()).length;
  document.getElementById("co-count-sub").textContent = `${today} today`;
  document.getElementById("co-avg").textContent = rows.length ? fmtMoney(rows.reduce((s, r) => s + r.pay, 0) / rows.length) : "—";
  document.getElementById("co-avg-sub").textContent = rows.length ? `across ${rows.length} calls with a payout` : "log a payout to see this";

  const best = coBestRange(rows);
  document.getElementById("co-best").textContent = best ? best.label : "—";
  document.getElementById("co-best-sub").textContent = best
    ? `${fmtMoney(best.avg)} avg per call over ${best.n} calls`
    : "needs 3+ paid calls in a range — keep logging";

  // payouts list
  const pays = Object.entries(calloutPay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
  document.getElementById("co-pay-list").innerHTML = pays.length ? pays.map(([d, v]) =>
    `<span class="pill">${d.slice(5)} · ${fmtMoney(v)} <button class="del" data-pay="${d}" title="Remove">✕</button></span>`).join(" ") : "";
  document.querySelectorAll("#co-pay-list [data-pay]").forEach(b => b.addEventListener("click", () => {
    delete calloutPay[b.dataset.pay]; store.save("life.calloutPay", calloutPay); renderCallouts();
  }));

  // calls table
  const payByDay = {};
  for (const r of rows) payByDay[r.c.id] = r.pay;
  const body = document.getElementById("co-rows");
  body.innerHTML = callouts.length ? [...callouts].sort((a, b) => b.ts - a.ts).map(c => `
    <tr data-id="${c.id}">
      <td>${new Date(c.ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
      <td><a href="https://pump.fun/coin/${c.mint}" target="_blank" rel="noopener">${esc(c.symbol ? "$" + c.symbol : c.mint.slice(0, 6) + "…")}</a></td>
      <td class="num">${c.mcCall == null && !c.fetched ? '<span class="muted">…</span>' : coUsd(c.mcCall)}</td>
      <td class="num ${coCls(c.px1h)}">${coPct(c.px1h)}</td>
      <td class="num ${coCls(c.px4h)}">${coPct(c.px4h)}</td>
      <td class="num"><input class="co-in" data-f="fol1h" type="number" step="any" placeholder="%" value="${c.fol1h ?? ""}"></td>
      <td class="num"><input class="co-in" data-f="fol4h" type="number" step="any" placeholder="%" value="${c.fol4h ?? ""}"></td>
      <td><input type="checkbox" data-f="held" ${c.held ? "checked" : ""}></td>
      <td class="num">${c.id in payByDay ? fmtMoney(payByDay[c.id]) : '<span class="muted">—</span>'}</td>
      <td><button class="del" data-del="${c.id}" title="Delete call">✕</button></td>
    </tr>`).join("") : `<tr><td colspan="10" class="empty">No calls yet — paste a coin above when you make a callout.</td></tr>`;

  body.querySelectorAll("tr[data-id]").forEach(tr => {
    const c = callouts.find(x => x.id === tr.dataset.id);
    tr.querySelectorAll(".co-in").forEach(inp => inp.addEventListener("change", () => {
      c[inp.dataset.f] = inp.value === "" ? null : +inp.value;
      store.save("life.callouts", callouts); renderCallouts();
    }));
    tr.querySelector('[data-f="held"]').addEventListener("change", e => {
      c.held = e.target.checked; store.save("life.callouts", callouts); renderCallouts();
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      if (!confirm("Delete this call?")) return;
      callouts = callouts.filter(x => x.id !== c.id); store.save("life.callouts", callouts); renderCallouts();
    });
  });
}

const coLocalInput = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

document.getElementById("co-form").addEventListener("submit", async e => {
  e.preventDefault();
  const status = document.getElementById("co-status");
  const mint = parseMint(document.getElementById("co-mint").value);
  if (!mint) { status.textContent = "Couldn't find a coin address in that — paste the mint or the pump.fun link."; status.className = "statusmsg down"; return; }
  const ts = new Date(document.getElementById("co-time").value || Date.now()).getTime();
  const c = { id: uid(), ts, mint, held: document.getElementById("co-held").checked, mcCall: null, px1h: null, px4h: null, fol1h: null, fol4h: null };
  callouts.push(c); store.save("life.callouts", callouts);
  document.getElementById("co-mint").value = "";
  document.getElementById("co-time").value = coLocalInput(new Date());
  status.textContent = "Saved — fetching market cap…"; status.className = "statusmsg";
  renderCallouts();
  await fetchCallData(c);
  store.save("life.callouts", callouts); renderCallouts();
  status.textContent = c.mcCall != null ? `Logged ${c.symbol ? "$" + c.symbol : "call"} at ${coUsd(c.mcCall)} MC.` : "Saved. Price data isn't available yet — hit ↻ Update prices later.";
});

document.getElementById("co-pay-form").addEventListener("submit", e => {
  e.preventDefault();
  const d = document.getElementById("co-pay-date").value, v = +document.getElementById("co-pay-amt").value;
  if (!d || !(v >= 0)) return;
  calloutPay[d] = v; store.save("life.calloutPay", calloutPay);
  document.getElementById("co-pay-amt").value = "";
  renderCallouts();
});

document.getElementById("co-refresh").addEventListener("click", () => refreshCallouts(false));

document.getElementById("co-time").value = coLocalInput(new Date());
document.getElementById("co-pay-date").value = coDay(Date.now() - 24 * CO_HOUR); // payouts usually land for yesterday's calls
renderCallouts();
// fill in 1h/4h moves for recent calls whose windows have since closed
if (!window.IS_DEMO) setTimeout(() => refreshCallouts(true), 1500);
