/* ============ Storage ============ */
const store = {
  load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    if (window.onDataChanged) window.onDataChanged(key);
  }
};

let trades = store.load("life.trades", []);  // {id, date, startSol, endSol}
let swaps  = store.load("life.swaps", []);   // {id, date, sol, usd}
let assets = store.load("life.assets", []);  // {id, kind, symbol, name, cgId, qty, buyPrice, manualPrice}
let food   = store.load("life.food", []);    // {id, date, name, kcal, servings}
let goals  = store.load("life.goals", []);   // {id, title, target, current, unit}
let settings = store.load("life.settings", { calGoal: 2000 });
let priceCache = store.load("life.prices", {}); // key -> {price, change24h, updated}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmtMoney = n => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPrice = n => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 6 : 2 });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ============ Tabs ============ */
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

/* ============ Money: daily SOL profit tracking ============ */
let viewMonth = todayStr().slice(0, 7); // which month the daily log table shows

const tradeProfit = t => t.endSol - t.startSol;
const fmtSol = n => (n >= 0 ? "+" : "") + n.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " SOL";

/* --- historical SOL prices: each day's profit is valued at that day's close --- */
let solHist = store.load("life.solHist", {}); // "YYYY-MM-DD" -> USD close price
let solHistBusy = false;
const solHistAttempted = new Set();

function histSolPrice(date) {
  if (date === todayStr()) { const sp = solPriceInfo(); if (sp) return sp.price; }
  return solHist[date] ?? solPriceInfo()?.price ?? null;
}

const usdForTrade = t => {
  const p = histSolPrice(t.date);
  return p != null ? tradeProfit(t) * p : null;
};

async function ensureSolHistory() {
  if (solHistBusy) return;
  const missing = [...new Set(trades.map(t => t.date))]
    .filter(d => d < todayStr() && !(d in solHist) && !solHistAttempted.has(d))
    .sort();
  if (!missing.length) return;
  solHistBusy = true;
  missing.forEach(d => solHistAttempted.add(d));
  try {
    // Coinbase daily candles, max ~300 per request
    let from = new Date(missing[0] + "T00:00:00Z");
    const end = new Date(missing[missing.length - 1] + "T00:00:00Z");
    let got = false;
    while (from <= end) {
      const to = new Date(Math.min(from.getTime() + 299 * 86400e3, end.getTime() + 86400e3));
      const res = await fetch(`https://api.exchange.coinbase.com/products/SOL-USD/candles?granularity=86400&start=${from.toISOString()}&end=${to.toISOString()}`);
      if (!res.ok) throw new Error("history " + res.status);
      for (const c of await res.json()) {
        solHist[new Date(c[0] * 1000).toISOString().slice(0, 10)] = c[4]; // close
        got = true;
      }
      from = new Date(to.getTime());
    }
    if (got) {
      store.save("life.solHist", solHist);
      renderMoney(); renderDashboard();
    }
  } catch {} // fall back to live price for unpriced days
  solHistBusy = false;
}

function solPriceInfo() {
  const c = priceCache["cg:solana"];
  return c && isFinite(c.price) ? c : null;
}

// SOL price drives all USD conversions (like the "SOL Price" cell in the spreadsheet).
// Fetched independently of the Assets tab so it works even with no SOL asset added.
async function ensureSolPrice(force) {
  const c = solPriceInfo();
  if (!force && c && Date.now() - c.updated < 10 * 60 * 1000) return;
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true");
    const data = await res.json();
    if (data.solana && isFinite(data.solana.usd)) {
      priceCache["cg:solana"] = { price: data.solana.usd, change24h: data.solana.usd_24h_change ?? null, updated: Date.now() };
      store.save("life.prices", priceCache);
      renderMoney(); renderDashboard();
    }
  } catch {}
}

document.getElementById("trade-form").addEventListener("submit", e => {
  e.preventDefault();
  const date = document.getElementById("trade-date").value || todayStr();
  const startSol = parseFloat(document.getElementById("trade-start").value);
  const endSol = parseFloat(document.getElementById("trade-end").value);
  if (!isFinite(startSol) || !isFinite(endSol)) return;
  const existing = trades.find(t => t.date === date);
  if (existing) { existing.startSol = startSol; existing.endSol = endSol; }
  else trades.push({ id: uid(), date, startSol, endSol });
  store.save("life.trades", trades);
  viewMonth = date.slice(0, 7);
  e.target.reset();
  document.getElementById("trade-date").value = todayStr();
  renderMoney(); renderDashboard();
  ensureSolHistory(); // back-dated entries need that day's price
});

document.getElementById("month-prev").addEventListener("click", () => shiftMonth(-1));
document.getElementById("month-next").addEventListener("click", () => shiftMonth(1));
function shiftMonth(delta) {
  const [y, m] = viewMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  viewMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  renderMoney();
}

document.getElementById("swap-form").addEventListener("submit", e => {
  e.preventDefault();
  const date = document.getElementById("swap-date").value || todayStr();
  const sol = parseFloat(document.getElementById("swap-sol").value);
  const usd = parseFloat(document.getElementById("swap-usd").value);
  if (!isFinite(sol) || sol <= 0 || !isFinite(usd) || usd <= 0) return;
  swaps.push({ id: uid(), date, sol, usd });
  store.save("life.swaps", swaps);
  e.target.reset();
  document.getElementById("swap-date").value = todayStr();
  viewMonth = date.slice(0, 7); // show the month the swap landed in
  renderMoney();
});

function sumTrades(list) {
  const sol = list.reduce((s, t) => s + tradeProfit(t), 0);
  let usd = null;
  for (const t of list) {
    const u = usdForTrade(t); // valued at that day's SOL price
    if (u != null) usd = (usd ?? 0) + u;
  }
  return { sol, usd, days: list.length };
}

const monthTotals = monthPrefix => sumTrades(trades.filter(t => t.date.startsWith(monthPrefix)));

function renderMoney() {
  const sp = solPriceInfo();
  const price = sp ? sp.price : null;
  const t = todayStr();

  // --- cards ---
  const todayTrade = trades.find(x => x.date === t);
  const todayEl = document.getElementById("money-today");
  const todaySub = document.getElementById("money-today-sub");
  if (todayTrade) {
    const pSol = tradeProfit(todayTrade);
    todayEl.textContent = price != null ? fmtMoney(pSol * price) : "—";
    todayEl.className = "big " + (pSol > 0 ? "up" : pSol < 0 ? "down" : "");
    todaySub.textContent = fmtSol(pSol) + ` (${todayTrade.startSol} → ${todayTrade.endSol})`;
  } else {
    todayEl.textContent = "$0.00"; todayEl.className = "big";
    todaySub.textContent = "no entry yet — log today below";
  }

  const mt = monthTotals(t.slice(0, 7));
  const monthEl = document.getElementById("money-month");
  monthEl.textContent = mt.usd != null ? fmtMoney(mt.usd) : "—";
  monthEl.className = "big " + (mt.sol > 0 ? "up" : mt.sol < 0 ? "down" : "");
  document.getElementById("money-month-sub").textContent = fmtSol(mt.sol) + ` over ${mt.days} day${mt.days === 1 ? "" : "s"}`;

  const priceEl = document.getElementById("sol-price");
  priceEl.textContent = price != null ? fmtPrice(price) : "—";
  const ps = document.getElementById("sol-price-sub");
  if (sp && sp.change24h != null) {
    ps.textContent = `${sp.change24h >= 0 ? "▲" : "▼"} ${Math.abs(sp.change24h).toFixed(2)}% · 24h`;
    ps.className = "sub " + (sp.change24h >= 0 ? "up" : "down");
  } else { ps.textContent = "live from CoinGecko"; ps.className = "sub"; }

  // --- monthly daily log table ---
  const [vy, vm] = viewMonth.split("-").map(Number);
  document.getElementById("month-label").textContent =
    new Date(vy, vm - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const vt = monthTotals(viewMonth);

  // YTD: Jan 1 of the viewed year through the end of the viewed month
  const viewYear = viewMonth.slice(0, 4);
  const ytd = sumTrades(trades.filter(t => t.date.slice(0, 4) === viewYear && t.date.slice(0, 7) <= viewMonth));
  const ytdEl = document.getElementById("ytd-totals");
  ytdEl.textContent = ytd.days
    ? `${viewYear} YTD: ${fmtSol(ytd.sol)}${ytd.usd != null ? " · " + fmtMoney(ytd.usd) : ""}` : "";
  ytdEl.className = ytd.sol > 0 ? "up" : ytd.sol < 0 ? "down" : "muted";

  const totEl = document.getElementById("month-totals");
  totEl.textContent = vt.days
    ? `month total: ${fmtSol(vt.sol)}${vt.usd != null ? " · " + fmtMoney(vt.usd) : ""}` : "";
  totEl.className = vt.sol > 0 ? "up" : vt.sol < 0 ? "down" : "muted";

  const monthSwaps = swaps.filter(x => x.date.startsWith(viewMonth));
  const msSol = monthSwaps.reduce((s, x) => s + x.sol, 0);
  const msUsd = monthSwaps.reduce((s, x) => s + x.usd, 0);
  document.getElementById("month-swapped").textContent = monthSwaps.length
    ? `swapped: ${msSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL ↔ ${fmtMoney(msUsd)}` : "";

  const rows = trades.filter(x => x.date.startsWith(viewMonth)).sort((a, b) => b.date.localeCompare(a.date));
  const tbody = document.getElementById("trade-rows");
  tbody.innerHTML = rows.length ? rows.map(x => {
    const pSol = tradeProfit(x);
    const cls = pSol > 0 ? "p-pos" : pSol < 0 ? "p-neg" : "";
    const dayPrice = histSolPrice(x.date);
    const usd = usdForTrade(x);
    const priceNote = dayPrice != null
      ? (x.date === todayStr() || solHist[x.date] == null ? `live price ${fmtPrice(dayPrice)}` : `SOL ${fmtPrice(dayPrice)} on ${x.date}`)
      : "";
    return `
    <tr>
      <td>${esc(x.date)}</td>
      <td class="num">${x.startSol}</td>
      <td class="num">${x.endSol}</td>
      <td class="num ${cls}">${fmtSol(pSol)}</td>
      <td class="num ${cls}" title="${priceNote}">${usd != null ? fmtMoney(usd) : "—"}</td>
      <td class="num"><button class="del" data-id="${x.id}" title="Delete">✕</button></td>
    </tr>`;
  }).join("") + (rows.length > 1 ? `
    <tr class="totals">
      <td colspan="3">Month total</td>
      <td class="num ${vt.sol > 0 ? "up" : vt.sol < 0 ? "down" : ""}">${fmtSol(vt.sol)}</td>
      <td class="num ${vt.sol > 0 ? "up" : vt.sol < 0 ? "down" : ""}">${vt.usd != null ? fmtMoney(vt.usd) : "—"}</td>
      <td></td>
    </tr>` : "")
    : `<tr><td colspan="6" class="empty">No trading days logged for this month.</td></tr>`;
  tbody.querySelectorAll(".del").forEach(b => b.addEventListener("click", () => {
    trades = trades.filter(x => x.id !== b.dataset.id);
    store.save("life.trades", trades);
    renderMoney(); renderDashboard();
  }));

  // --- swaps (only the viewed month) ---
  const monthName = new Date(vy, vm - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  document.getElementById("swap-month-label").textContent = "· " + monthName;
  const totSol = swaps.reduce((s, x) => s + x.sol, 0);
  const totUsd = swaps.reduce((s, x) => s + x.usd, 0);
  document.getElementById("swap-alltime").textContent = swaps.length
    ? `all-time: ${totSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL ↔ ${fmtMoney(totUsd)} · avg ${fmtPrice(totUsd / totSol)}` : "";

  const stbody = document.getElementById("swap-rows");
  stbody.innerHTML = monthSwaps.length ? [...monthSwaps].sort((a, b) => b.date.localeCompare(a.date)).map(x => `
    <tr>
      <td>${esc(x.date)}</td>
      <td class="num">${x.sol}</td>
      <td class="num">${fmtMoney(x.usd)}</td>
      <td class="num">${fmtPrice(x.usd / x.sol)}</td>
      <td class="num"><button class="del" data-id="${x.id}" title="Delete">✕</button></td>
    </tr>`).join("") + (monthSwaps.length > 1 ? `
    <tr class="totals">
      <td>Month total</td>
      <td class="num">${msSol.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="num">${fmtMoney(msUsd)}</td>
      <td class="num">avg ${fmtPrice(msUsd / msSol)}</td>
      <td></td>
    </tr>` : "")
    : `<tr><td colspan="5" class="empty">No swaps in ${monthName}.</td></tr>`;
  stbody.querySelectorAll(".del").forEach(b => b.addEventListener("click", () => {
    swaps = swaps.filter(x => x.id !== b.dataset.id);
    store.save("life.swaps", swaps);
    renderMoney();
  }));
}

function setMoneyStat(id, val) {
  const el = document.getElementById(id);
  el.textContent = fmtMoney(val);
  el.className = "big " + (val > 0 ? "up" : val < 0 ? "down" : "");
}

/* ============ Assets ============ */
const assetForm = document.getElementById("asset-form");
assetForm.addEventListener("submit", async e => {
  e.preventDefault();
  const kind = document.getElementById("asset-kind").value;
  const symbol = document.getElementById("asset-symbol").value.trim().toUpperCase();
  const qty = parseFloat(document.getElementById("asset-qty").value);
  const buyPrice = parseFloat(document.getElementById("asset-buy").value) || 0;
  if (!symbol || !isFinite(qty) || qty < 0) return;

  const asset = { id: uid(), kind, symbol, name: symbol, cgId: null, qty, buyPrice, manualPrice: null };

  if (kind === "crypto") {
    setStatus("asset-status", `Looking up ${symbol} on CoinGecko…`);
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`);
      const data = await res.json();
      const hit = (data.coins || []).find(c => c.symbol.toUpperCase() === symbol) || (data.coins || [])[0];
      if (hit) { asset.cgId = hit.id; asset.name = hit.name; }
      else setStatus("asset-status", `Couldn't find "${symbol}" on CoinGecko — you can set a manual price in the table.`);
    } catch {
      setStatus("asset-status", "CoinGecko lookup failed (offline?). Added with manual pricing.");
    }
  }

  assets.push(asset);
  store.save("life.assets", assets);
  assetForm.reset();
  renderAssets(); renderDashboard();
  refreshPrices();
});

function priceKey(a) { return a.kind === "crypto" ? "cg:" + (a.cgId || a.symbol) : "st:" + a.symbol; }

function currentPrice(a) {
  if (a.manualPrice != null) return { price: a.manualPrice, change24h: null, source: "manual" };
  const c = priceCache[priceKey(a)];
  if (c && isFinite(c.price)) return { price: c.price, change24h: c.change24h, source: "live" };
  return null;
}

let refreshing = false;
async function refreshPrices() {
  if (refreshing || !assets.length) return;
  refreshing = true;
  const btn = document.getElementById("refresh-btn");
  btn.disabled = true; btn.textContent = "Refreshing…";
  setStatus("asset-status", "Fetching live prices…");
  let errors = [];

  // --- Crypto via CoinGecko (one batched call) ---
  const cryptoIds = [...new Set(assets.filter(a => a.kind === "crypto" && a.cgId).map(a => a.cgId))];
  if (cryptoIds.length) {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd&include_24hr_change=true`);
      const data = await res.json();
      for (const id of cryptoIds) {
        if (data[id] && isFinite(data[id].usd)) {
          priceCache["cg:" + id] = { price: data[id].usd, change24h: data[id].usd_24h_change ?? null, updated: Date.now() };
        }
      }
    } catch { errors.push("crypto prices (CoinGecko unreachable)"); }
  }

  // --- Stocks via Yahoo Finance through a CORS proxy ---
  const stockSymbols = [...new Set(assets.filter(a => a.kind === "stock").map(a => a.symbol))];
  for (const sym of stockSymbols) {
    try {
      const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
      // Yahoo blocks direct browser requests, so go through a CORS proxy (with a fallback proxy).
      let res;
      try {
        res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(yUrl)}`);
        if (!res.ok) throw new Error("proxy " + res.status);
      } catch {
        res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(yUrl)}`);
      }
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && isFinite(meta.regularMarketPrice)) {
        const prev = meta.chartPreviousClose || meta.previousClose;
        const change = prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : null;
        priceCache["st:" + sym] = { price: meta.regularMarketPrice, change24h: change, updated: Date.now() };
      } else errors.push(sym);
    } catch { errors.push(sym); }
  }

  store.save("life.prices", priceCache);
  btn.disabled = false; btn.textContent = "↻ Refresh prices";
  refreshing = false;
  setStatus("asset-status", (errors.length
    ? `Updated, but couldn't fetch: ${errors.join(", ")}. Set a manual price for those if needed.`
    : `Prices updated ${new Date().toLocaleTimeString()}.`) + " Auto-refreshes every 10 min.");
  renderAssets(); renderDashboard();
}

// Live prices: refresh automatically every 10 minutes while the app is open.
setInterval(() => { refreshPrices(); ensureSolPrice(); }, 10 * 60 * 1000);

document.getElementById("refresh-btn").addEventListener("click", refreshPrices);

function renderAssets() {
  const tbody = document.getElementById("asset-rows");
  if (!assets.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">No assets yet — add your first holding above.</td></tr>`;
    updatePortfolioCards();
    return;
  }

  tbody.innerHTML = assets.map(a => {
    const p = currentPrice(a);
    const watching = a.qty === 0;
    const value = p && !watching ? p.price * a.qty : null;
    const cost = a.buyPrice * a.qty;
    const gain = value != null ? value - cost : null;
    const gainPct = gain != null && cost > 0 ? (gain / cost) * 100 : null;
    const dayCls = p?.change24h == null ? "neutral" : p.change24h >= 0 ? "up" : "down";
    const gainCls = gain == null ? "neutral" : gain >= 0 ? "up" : "down";
    return `
    <tr>
      <td><strong>${esc(a.symbol)}</strong><br><span class="muted">${esc(a.name)}${a.manualPrice != null ? " · manual" : ""}</span></td>
      <td class="num">${watching ? "<span class='muted'>watching</span>" : a.qty}</td>
      <td class="num">${watching ? "<span class='muted'>—</span>" : fmtPrice(a.buyPrice)}</td>
      <td class="num">${p ? fmtPrice(p.price) : "<span class='muted'>—</span>"}</td>
      <td class="num ${dayCls}">${p?.change24h != null ? (p.change24h >= 0 ? "▲ " : "▼ ") + Math.abs(p.change24h).toFixed(2) + "%" : "—"}</td>
      <td class="num">${value != null ? fmtMoney(value) : "—"}</td>
      <td class="num ${gainCls}">${gain != null ? (gain >= 0 ? "+" : "") + fmtMoney(gain).replace("-$", "-$") + (gainPct != null ? ` (${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%)` : "") : "—"}</td>
      <td class="num">
        <button class="del" data-act="price" data-id="${a.id}" title="Set manual price">✎</button>
        <button class="del" data-act="del" data-id="${a.id}" title="Delete">✕</button>
      </td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll(".del").forEach(b => b.addEventListener("click", () => {
    const a = assets.find(x => x.id === b.dataset.id);
    if (!a) return;
    if (b.dataset.act === "del") {
      if (!confirm(`Remove ${a.symbol} from your portfolio?`)) return;
      assets = assets.filter(x => x.id !== a.id);
    } else {
      const input = prompt(`Current price for ${a.symbol} (leave empty to go back to live prices):`, a.manualPrice ?? "");
      if (input === null) return;
      const v = parseFloat(input);
      a.manualPrice = input.trim() === "" || !isFinite(v) ? null : v;
    }
    store.save("life.assets", assets);
    renderAssets(); renderDashboard();
  }));

  updatePortfolioCards();
}

function portfolioTotals() {
  let value = 0, cost = 0, dayChangeUsd = 0, priced = 0;
  for (const a of assets) {
    if (a.qty === 0) continue; // watch-only: price tracking, not part of the portfolio
    const p = currentPrice(a);
    cost += a.buyPrice * a.qty;
    if (p) {
      value += p.price * a.qty;
      priced++;
      if (p.change24h != null) {
        const prev = p.price / (1 + p.change24h / 100);
        dayChangeUsd += (p.price - prev) * a.qty;
      }
    }
  }
  return { value, cost, gain: value - cost, dayChangeUsd, priced, total: assets.length };
}

function updatePortfolioCards() {
  const t = portfolioTotals();
  document.getElementById("port-value").textContent = t.priced ? fmtMoney(t.value) : "—";
  const dayEl = document.getElementById("port-day");
  dayEl.textContent = t.priced ? (t.dayChangeUsd >= 0 ? "+" : "") + fmtMoney(t.dayChangeUsd) : "—";
  dayEl.className = "big " + (t.dayChangeUsd > 0 ? "up" : t.dayChangeUsd < 0 ? "down" : "");
  const gainEl = document.getElementById("port-gain");
  gainEl.textContent = t.priced ? (t.gain >= 0 ? "+" : "") + fmtMoney(t.gain) : "—";
  gainEl.className = "big " + (t.gain > 0 ? "up" : t.gain < 0 ? "down" : "");
  document.getElementById("port-gain-sub").textContent = t.cost > 0 && t.priced
    ? `${t.gain >= 0 ? "+" : ""}${((t.gain / t.cost) * 100).toFixed(1)}% vs what you paid` : "vs what you paid";
}

/* ============ Food ============ */
const foodSearch = document.getElementById("food-search");
const foodResults = document.getElementById("food-results");
const foodKcal = document.getElementById("food-kcal");
let selectedFood = null;

foodSearch.addEventListener("input", () => {
  selectedFood = null;
  const q = foodSearch.value.trim().toLowerCase();
  if (q.length < 2) { foodResults.classList.remove("open"); return; }
  const hits = FOOD_DB.filter(f => f.name.toLowerCase().includes(q)).slice(0, 12);
  if (!hits.length) { foodResults.classList.remove("open"); return; }
  foodResults.innerHTML = hits.map((f, i) => {
    const idx = FOOD_DB.indexOf(f);
    return `<div data-idx="${idx}"><span>${esc(f.name)} <span class="muted">(${esc(f.serving)})</span></span><span class="kcal">${f.kcal} cal</span></div>`;
  }).join("");
  foodResults.classList.add("open");
  foodResults.querySelectorAll("div[data-idx]").forEach(el => el.addEventListener("mousedown", e => {
    e.preventDefault();
    pickFood(FOOD_DB[+el.dataset.idx]);
  }));
});

foodSearch.addEventListener("blur", () => setTimeout(() => foodResults.classList.remove("open"), 150));

function pickFood(f) {
  selectedFood = f;
  foodSearch.value = f.name;
  foodKcal.value = f.kcal;
  foodResults.classList.remove("open");
  document.getElementById("food-servings").focus();
}

document.getElementById("food-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = foodSearch.value.trim();
  const servings = parseFloat(document.getElementById("food-servings").value) || 1;
  const kcalEach = parseFloat(foodKcal.value);
  if (!name || !isFinite(kcalEach) || kcalEach < 0) return;
  food.push({ id: uid(), date: todayStr(), name, kcal: Math.round(kcalEach * servings), servings });
  store.save("life.food", food);
  e.target.reset();
  document.getElementById("food-servings").value = 1;
  selectedFood = null;
  renderFood(); renderDashboard();
});

/* ----- "Eating out" meal builder ----- */
const mbRestaurant = document.getElementById("mb-restaurant");
let restState = store.load("life.restaurants", { enabled: ["Chipotle", "Subway"], custom: {} });

function mbConfig() { return restState.custom[mbRestaurant.value] || MEAL_BUILDER[mbRestaurant.value]; }

function renderRestaurantSelect(selectName) {
  const names = restState.enabled.filter(n => MEAL_BUILDER[n] || restState.custom[n]);
  mbRestaurant.innerHTML = names.map(r => `<option>${esc(r)}</option>`).join("");
  if (selectName && names.includes(selectName)) mbRestaurant.value = selectName;
  renderBuilder();
}

function renderLibrary() {
  const available = Object.keys(MEAL_BUILDER).filter(n => !restState.enabled.includes(n));
  document.getElementById("mb-library").innerHTML = available.length
    ? available.map(n => `<label class="check" data-lib="${esc(n)}" style="justify-content:center">${esc(n)}</label>`).join("")
    : `<span class="muted">All built-in restaurants are already on your list.</span>`;
  document.querySelectorAll("#mb-library [data-lib]").forEach(el => el.addEventListener("click", () => {
    restState.enabled.push(el.dataset.lib);
    store.save("life.restaurants", restState);
    document.getElementById("mb-add-panel").style.display = "none";
    renderRestaurantSelect(el.dataset.lib);
  }));
}

document.getElementById("mb-add-btn").addEventListener("click", () => {
  const panel = document.getElementById("mb-add-panel");
  panel.style.display = panel.style.display === "none" ? "" : "none";
  renderLibrary();
});

document.getElementById("mb-create-btn").addEventListener("click", () => {
  const name = document.getElementById("mb-new-name").value.trim();
  if (!name) return;
  if (MEAL_BUILDER[name] || restState.custom[name]) { alert("That restaurant already exists."); return; }
  restState.custom[name] = { formats: [{ name: "Order", kcal: 0, mult: 1 }], groups: [], custom: true };
  restState.enabled.push(name);
  store.save("life.restaurants", restState);
  document.getElementById("mb-new-name").value = "";
  document.getElementById("mb-add-panel").style.display = "none";
  renderRestaurantSelect(name);
});

document.getElementById("mb-remove-btn").addEventListener("click", () => {
  const name = mbRestaurant.value;
  if (!name) return;
  const isCustom = !!restState.custom[name];
  if (!confirm(isCustom
    ? `Delete "${name}" and its menu? (Meals already logged stay in your history.)`
    : `Remove "${name}" from your list? You can re-add it anytime from the library.`)) return;
  restState.enabled = restState.enabled.filter(n => n !== name);
  delete restState.custom[name];
  store.save("life.restaurants", restState);
  renderRestaurantSelect();
});

document.getElementById("mb-item-add").addEventListener("click", () => {
  const conf = mbConfig();
  if (!conf || !conf.custom) return;
  const gName = document.getElementById("mb-item-group").value.trim() || "Menu";
  const iName = document.getElementById("mb-item-name").value.trim();
  const kcal = parseInt(document.getElementById("mb-item-kcal").value);
  if (!iName || !isFinite(kcal) || kcal < 0) return;
  let group = conf.groups.find(g => g.name.toLowerCase() === gName.toLowerCase());
  if (!group) { group = { name: gName, items: [] }; conf.groups.push(group); }
  group.items.push({ name: iName, kcal });
  store.save("life.restaurants", restState);
  document.getElementById("mb-item-name").value = "";
  document.getElementById("mb-item-kcal").value = "";
  renderBuilder();
  document.getElementById("mb-item-name").focus();
});

function renderBuilder() {
  const conf = mbConfig();
  const editor = document.getElementById("mb-editor");
  if (!conf) {
    document.getElementById("mb-formats").innerHTML = "";
    document.getElementById("mb-groups").innerHTML = `<div class="empty">No restaurants on your list — click "+ Add restaurant".</div>`;
    document.getElementById("mb-log").textContent = "Log meal — 0 cal";
    editor.style.display = "none";
    return;
  }
  editor.style.display = conf.custom ? "" : "none";
  if (conf.custom && !conf.groups.length) {
    document.getElementById("mb-formats").innerHTML = "";
    document.getElementById("mb-groups").innerHTML = `<div class="empty">No menu yet — add this restaurant's items below (grab calories from their menu or site).</div>`;
    document.getElementById("mb-log").textContent = "Log meal — 0 cal";
    return;
  }
  document.getElementById("mb-formats").innerHTML = conf.formats.map((f, i) => `
    <label class="check"><input type="radio" name="mb-format" value="${i}" ${i === 0 ? "checked" : ""}>
      ${esc(f.name)}<span class="kcal">${f.kcal ? "+" + f.kcal : f.mult > 1 ? "×" + f.mult : ""}</span>
    </label>`).join("");
  document.getElementById("mb-groups").innerHTML = conf.groups.map((g, gi) => `
    <div class="builder-group">
      <div class="gname">${esc(g.name)}</div>
      <div class="check-grid">${g.items.map((it, ii) => `
        <label class="check"><input type="checkbox" data-g="${gi}" data-i="${ii}">
          ${esc(it.name)}<span class="kcal">${it.kcal} cal</span>${conf.custom ? `<button class="del mb-item-del" data-g="${gi}" data-i="${ii}" title="Remove from menu">✕</button>` : ""}
        </label>`).join("")}</div>
    </div>`).join("");
  document.querySelectorAll("#mb-formats input, #mb-groups input").forEach(el =>
    el.addEventListener("change", updateBuilderTotal));
  document.querySelectorAll(".mb-item-del").forEach(btn => btn.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    const conf2 = mbConfig();
    conf2.groups[+btn.dataset.g].items.splice(+btn.dataset.i, 1);
    conf2.groups = conf2.groups.filter(g => g.items.length);
    store.save("life.restaurants", restState);
    renderBuilder();
  }));
  updateBuilderTotal();
}

function builderSelection() {
  const conf = mbConfig();
  const fmtInput = document.querySelector('input[name="mb-format"]:checked');
  if (!conf || !fmtInput) return { fmt: null, picked: [], total: 0 };
  const fmt = conf.formats[+fmtInput.value];
  const picked = [...document.querySelectorAll("#mb-groups input:checked")]
    .map(el => conf.groups[+el.dataset.g].items[+el.dataset.i]);
  const total = Math.round(fmt.kcal + fmt.mult * picked.reduce((s, it) => s + it.kcal, 0));
  return { fmt, picked, total };
}

function updateBuilderTotal() {
  const { total } = builderSelection();
  document.getElementById("mb-log").textContent = `Log meal — ${total.toLocaleString()} cal`;
}

mbRestaurant.addEventListener("change", renderBuilder);
document.getElementById("mb-clear").addEventListener("click", renderBuilder);
document.getElementById("mb-log").addEventListener("click", () => {
  const { fmt, picked, total } = builderSelection();
  if (!picked.length) return;
  const fmtLabel = fmt.name === "Order" ? "" : " " + fmt.name.split(" (")[0];
  const name = `${mbRestaurant.value}${fmtLabel} — ${picked.map(p => p.name.toLowerCase()).join(", ")}`;
  food.push({ id: uid(), date: todayStr(), name, kcal: total, servings: 1 });
  store.save("life.food", food);
  renderBuilder();
  renderFood(); renderDashboard();
});

renderRestaurantSelect();

document.getElementById("cal-goal").addEventListener("change", e => {
  const v = parseInt(e.target.value);
  if (isFinite(v) && v > 0) { settings.calGoal = v; store.save("life.settings", settings); }
  renderFood(); renderDashboard();
});

function renderFood() {
  document.getElementById("cal-goal").value = settings.calGoal;
  const t = todayStr();
  const todays = food.filter(f => f.date === t);
  const total = todays.reduce((s, f) => s + f.kcal, 0);
  const remaining = settings.calGoal - total;

  document.getElementById("food-total").textContent = total.toLocaleString();
  const remEl = document.getElementById("food-remaining");
  remEl.textContent = (remaining >= 0 ? remaining : -remaining).toLocaleString() + (remaining >= 0 ? " left" : " over");
  remEl.className = "big " + (remaining >= 0 ? "up" : "down");

  const tbody = document.getElementById("food-rows");
  tbody.innerHTML = todays.length ? [...todays].reverse().map(f => `
    <tr>
      <td>${esc(f.name)}${f.servings !== 1 ? ` <span class="muted">× ${f.servings}</span>` : ""}</td>
      <td class="num">${f.kcal.toLocaleString()} cal</td>
      <td class="num"><button class="del" data-id="${f.id}" title="Delete">✕</button></td>
    </tr>`).join("")
    : `<tr><td colspan="3" class="empty">Nothing logged today — search a food above.</td></tr>`;
  tbody.querySelectorAll(".del").forEach(b => b.addEventListener("click", () => {
    food = food.filter(f => f.id !== b.dataset.id);
    store.save("life.food", food);
    renderFood(); renderDashboard();
  }));

  // last 7 days mini history
  const hist = document.getElementById("food-history");
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const sum = food.filter(f => f.date === ds).reduce((s, f) => s + f.kcal, 0);
    days.push({ label: i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" }), sum });
  }
  hist.innerHTML = days.map(d => `
    <tr><td>${d.label}</td>
      <td class="num">${d.sum ? d.sum.toLocaleString() + " cal" : "<span class='muted'>—</span>"}</td>
      <td class="num ${d.sum === 0 ? "neutral" : d.sum <= settings.calGoal ? "up" : "down"}">${d.sum === 0 ? "" : d.sum <= settings.calGoal ? "✓ under goal" : "over goal"}</td>
    </tr>`).join("");
}

/* ============ Goals ============ */
document.getElementById("goal-form").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("goal-title").value.trim();
  const target = parseFloat(document.getElementById("goal-target").value);
  const current = parseFloat(document.getElementById("goal-current").value) || 0;
  const unit = document.getElementById("goal-unit").value.trim();
  if (!title || !isFinite(target) || target <= 0) return;
  goals.push({ id: uid(), title, target, current, unit });
  store.save("life.goals", goals);
  e.target.reset();
  renderGoals(); renderDashboard();
});

function goalHtml(g, compact) {
  const pct = Math.min(100, (g.current / g.target) * 100);
  const done = g.current >= g.target;
  const fmt = v => g.unit === "$" ? fmtMoney(v) : v.toLocaleString() + (g.unit ? " " + esc(g.unit) : "");
  return `
  <div class="goal" data-id="${g.id}">
    <div class="goal-top">
      <span class="goal-title">${esc(g.title)} ${done ? '<span class="pill done">✓ done</span>' : ""}</span>
      <span class="goal-meta">${fmt(g.current)} / ${fmt(g.target)} · ${pct.toFixed(0)}%</span>
    </div>
    <div class="bar ${done ? "full" : ""}"><span style="width:${pct}%"></span></div>
    ${compact ? "" : `
    <div class="goal-actions">
      <input type="number" step="any" placeholder="Add progress…" class="goal-add">
      <button class="btn small goal-add-btn">Add</button>
      <button class="btn small ghost goal-set-btn">Set total</button>
      <button class="del goal-del" title="Delete goal">✕</button>
    </div>`}
  </div>`;
}

function renderGoalList(wrap, compact) {
  wrap.innerHTML = goals.length ? goals.map(g => goalHtml(g, compact)).join("")
    : `<div class="empty">No goals yet — add one on the Goals tab (e.g. "Save $5,000" or "Run 100 miles").</div>`;
  if (compact) return;

  wrap.querySelectorAll(".goal").forEach(el => {
    const g = goals.find(x => x.id === el.dataset.id);
    const input = el.querySelector(".goal-add");
    const apply = (setMode) => {
      const v = parseFloat(input.value);
      if (!isFinite(v)) return;
      g.current = setMode ? v : g.current + v;
      if (g.current < 0) g.current = 0;
      store.save("life.goals", goals);
      renderGoals(); renderDashboard();
    };
    el.querySelector(".goal-add-btn").addEventListener("click", () => apply(false));
    el.querySelector(".goal-set-btn").addEventListener("click", () => apply(true));
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); apply(false); } });
    el.querySelector(".goal-del").addEventListener("click", () => {
      if (!confirm(`Delete goal "${g.title}"?`)) return;
      goals = goals.filter(x => x.id !== g.id);
      store.save("life.goals", goals);
      renderGoals(); renderDashboard();
    });
  });
}

function renderGoals() {
  renderGoalList(document.getElementById("goal-list"), false);
}

/* ============ Dashboard ============ */
function renderDashboard() {
  const t = todayStr();

  const sp = solPriceInfo();
  const todayTrade = trades.find(x => x.date === t);
  const pSol = todayTrade ? tradeProfit(todayTrade) : 0;
  setMoneyStat("dash-money", todayTrade && sp ? pSol * sp.price : 0);
  document.getElementById("dash-money-sub").textContent = todayTrade
    ? fmtSol(pSol) + " trading today" : "no trading entry yet";

  const pt = portfolioTotals();
  document.getElementById("dash-port").textContent = pt.priced ? fmtMoney(pt.value) : "—";
  const dp = document.getElementById("dash-port-day");
  if (pt.priced) {
    dp.textContent = `${pt.dayChangeUsd >= 0 ? "▲" : "▼"} ${fmtMoney(Math.abs(pt.dayChangeUsd))} today`;
    dp.className = "sub " + (pt.dayChangeUsd >= 0 ? "up" : "down");
  } else if (assets.length && assets.every(a => a.qty === 0)) {
    dp.textContent = "watching prices only — add a quantity to track value";
    dp.className = "sub";
  } else dp.textContent = assets.length ? "hit Refresh on the Assets tab" : "no assets yet";

  const cals = food.filter(f => f.date === t).reduce((s, f) => s + f.kcal, 0);
  document.getElementById("dash-cal").textContent = cals.toLocaleString();
  document.getElementById("dash-cal-sub").textContent = `of ${settings.calGoal.toLocaleString()} cal goal (${Math.max(0, settings.calGoal - cals).toLocaleString()} left)`;

  const doneGoals = goals.filter(g => g.current >= g.target).length;
  document.getElementById("dash-goals").textContent = goals.length ? `${doneGoals} / ${goals.length}` : "—";
  document.getElementById("dash-goals-sub").textContent = goals.length ? "goals completed" : "no goals yet";

  // goals: interactive on the overview, compact on the money tab
  renderGoalList(document.getElementById("dash-goal-list"), false);
  renderGoalList(document.getElementById("money-goal-list"), true);

  // daily profits: today's entry only
  document.getElementById("dash-profit-rows").innerHTML = todayTrade ? (() => {
    const pSol = tradeProfit(todayTrade);
    const usd = usdForTrade(todayTrade);
    const cls = pSol > 0 ? "p-pos" : pSol < 0 ? "p-neg" : "";
    return `<tr>
      <td>Today <span class="muted">(${todayTrade.startSol} → ${todayTrade.endSol})</span></td>
      <td class="num ${cls}">${fmtSol(pSol)}</td>
      <td class="num ${cls}">${usd != null ? fmtMoney(usd) : "—"}</td>
    </tr>`;
  })() : `<tr><td colspan="3" class="empty">No entry for today yet — log it on the Money tab.</td></tr>`;

  // daily food progress
  const todaysFood = food.filter(f => f.date === t);
  const pct = Math.min(100, (cals / settings.calGoal) * 100);
  const bar = document.getElementById("dash-food-bar");
  bar.className = "bar" + (cals > settings.calGoal ? " over" : cals >= settings.calGoal ? " full" : "");
  bar.querySelector("span").style.width = pct + "%";
  document.getElementById("dash-food-text").textContent =
    `${cals.toLocaleString()} / ${settings.calGoal.toLocaleString()} cal · ${cals <= settings.calGoal
      ? (settings.calGoal - cals).toLocaleString() + " left"
      : (cals - settings.calGoal).toLocaleString() + " over"}`;
  document.getElementById("dash-food-items").innerHTML = todaysFood.length
    ? [...todaysFood].reverse().map(f => `<tr>
        <td>${esc(f.name)}${f.servings !== 1 ? ` <span class="muted">× ${f.servings}</span>` : ""}</td>
        <td class="num">${f.kcal.toLocaleString()} cal</td>
      </tr>`).join("")
    : `<tr><td colspan="2" class="empty">Nothing logged today — add meals on the Food tab.</td></tr>`;
}

/* ============ Init ============ */
document.getElementById("today-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
document.getElementById("trade-date").value = todayStr();
document.getElementById("swap-date").value = todayStr();
ensureSolPrice();
ensureSolHistory();
renderMoney();
renderAssets();
renderFood();
renderGoals();
renderDashboard();
if (assets.length) refreshPrices();

function setStatus(id, msg) { document.getElementById(id).textContent = msg; }
