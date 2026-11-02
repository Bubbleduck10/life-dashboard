/* ============ Sports Bets (separate from trading money) ============ */
// Bet history: track stake / result / payout with record + profit stats.
// Card maker: drag bet-slip images, type each win, pick an anime background,
// export a PNG showing the slips + total won. Slip images are session-only.

let bets = store.load("life.bets", []); // {id, date, event, stake, result, payout, note}

const BET_SCENES = [
  { key: "ocean",  name: "Ocean",      src: "assets/bg-ocean.jpg",  grad: ["#2aa0d8", "#0a3d5c"] },
  { key: "forest", name: "Forest",     src: "assets/bg-forest.jpg", grad: ["#2f9a52", "#0a2e18"] },
  { key: "sunset", name: "Sunset",     src: "assets/bg-sunset.jpg", grad: ["#ff8c42", "#7b2ff7"] },
  { key: "night",  name: "Night City", src: "assets/bg-night.jpg",  grad: ["#3a2a7e", "#0a0a2a"] },
  { key: "sakura", name: "Sakura",     src: "assets/bg-sakura.jpg", grad: ["#f7a8c4", "#7ec8ff"] },
];
const betSceneImgs = {};
BET_SCENES.forEach(s => {
  const img = new Image();
  img.onload = () => { if (betState.bg === s.key && betModalVisible()) drawBetCard(); renderBetScenePicker(); };
  img.src = s.src;
  betSceneImgs[s.key] = img;
});

let betSlips = [];          // {id, img, won}
let betCustomBg = null;     // uploaded Image
let betState = { bg: "ocean" };
const betModalVisible = () => document.getElementById("tab-bets").classList.contains("active");

/* ----- bet history ----- */
const betProfit = b => b.result === "won" ? (b.payout || 0) - b.stake : b.result === "lost" ? -b.stake : 0;

document.getElementById("bet-form").addEventListener("submit", e => {
  e.preventDefault();
  const date = document.getElementById("bet-date").value || todayStr();
  const event = document.getElementById("bet-event").value.trim();
  const stake = parseFloat(document.getElementById("bet-stake").value);
  const result = document.getElementById("bet-result").value;
  const payout = parseFloat(document.getElementById("bet-payout").value) || 0;
  if (!event || !isFinite(stake) || stake < 0) return;
  bets.push({ id: uid(), date, event, stake, result, payout });
  store.save("life.bets", bets);
  e.target.reset();
  document.getElementById("bet-date").value = todayStr();
  renderBets();
});

function renderBets() {
  const settled = bets.filter(b => b.result !== "pending");
  const won = bets.filter(b => b.result === "won").length;
  const lost = bets.filter(b => b.result === "lost").length;
  const pending = bets.filter(b => b.result === "pending").length;
  const net = bets.reduce((s, b) => s + betProfit(b), 0);
  const staked = settled.reduce((s, b) => s + b.stake, 0);
  const returned = bets.filter(b => b.result === "won").reduce((s, b) => s + (b.payout || 0), 0);
  const winRate = (won + lost) ? Math.round((won / (won + lost)) * 100) : null;
  const roi = staked ? (net / staked) * 100 : null;

  const netEl = document.getElementById("bet-net");
  netEl.textContent = (net >= 0 ? "" : "-") + "$" + Math.abs(net).toLocaleString(undefined, { maximumFractionDigits: 2 });
  netEl.className = "big " + (net > 0 ? "up" : net < 0 ? "down" : "");
  document.getElementById("bet-net-sub").textContent = roi != null ? `${roi >= 0 ? "+" : ""}${roi.toFixed(0)}% ROI` : "from settled bets";

  document.getElementById("bet-record").textContent = `${won}-${lost}${pending ? " (" + pending + "P)" : ""}`;
  document.getElementById("bet-record-sub").textContent = winRate != null ? `win rate ${winRate}%` : "win rate —";

  document.getElementById("bet-staked").textContent = "$" + staked.toLocaleString(undefined, { maximumFractionDigits: 0 });
  document.getElementById("bet-staked-sub").textContent = `won $${returned.toLocaleString(undefined, { maximumFractionDigits: 0 })} back`;

  const rows = [...bets].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const tbody = document.getElementById("bet-rows");
  const pill = r => r === "won" ? '<span class="pill up">Won</span>' : r === "lost" ? '<span class="pill down">Lost</span>' : '<span class="pill">Pending</span>';
  tbody.innerHTML = rows.length ? rows.map(b => {
    const p = betProfit(b);
    const cls = b.result === "won" ? "up" : b.result === "lost" ? "down" : "neutral";
    return `
    <tr>
      <td>${esc(b.date)}</td>
      <td>${esc(b.event)}</td>
      <td class="num">${fmtMoney(b.stake)}</td>
      <td>${pill(b.result)}</td>
      <td class="num ${cls}">${b.result === "pending" ? "—" : (p >= 0 ? "+" : "") + fmtMoney(p).replace("-", "")}</td>
      <td class="num" style="white-space:nowrap">
        <button class="del" data-act="settle" data-id="${b.id}" title="Update result / payout">✎</button>
        <button class="del" data-act="del" data-id="${b.id}" title="Delete">✕</button>
      </td>
    </tr>`;
  }).join("")
    : `<tr><td colspan="6" class="empty">No bets logged yet.</td></tr>`;
  tbody.querySelectorAll(".del").forEach(btn => btn.addEventListener("click", () => {
    const b = bets.find(x => x.id === btn.dataset.id);
    if (!b) return;
    if (btn.dataset.act === "del") {
      if (!confirm(`Delete "${b.event}"?`)) return;
      bets = bets.filter(x => x.id !== b.id);
    } else {
      const r = prompt(`Result for "${b.event}" — type won, lost, or pending:`, b.result);
      if (r === null) return;
      const rv = r.trim().toLowerCase();
      if (!["won", "lost", "pending"].includes(rv)) return;
      b.result = rv;
      if (rv === "won") { const p = prompt(`Total payout for "${b.event}" ($, including stake):`, b.payout || ""); if (p !== null) { const pv = parseFloat(p); if (isFinite(pv)) b.payout = pv; } }
    }
    store.save("life.bets", bets);
    renderBets();
  }));
}

/* ----- card maker ----- */
function renderBetScenePicker() {
  const box = document.getElementById("bet-bg-picker");
  box.innerHTML = BET_SCENES.map(s => {
    const img = betSceneImgs[s.key];
    const ready = img.complete && img.naturalWidth;
    const bg = ready ? `url('${s.src}') center/cover` : `linear-gradient(135deg,${s.grad[0]},${s.grad[1]})`;
    return `<span class="bet-scene ${betState.bg === s.key ? "on" : ""}" data-scene="${s.key}" title="${s.name}" style="background:${bg}"></span>`;
  }).join("") + (betCustomBg ? `<span class="bet-scene ${betState.bg === "custom" ? "on" : ""}" data-scene="custom" title="Your upload" style="background:url('${betCustomBg.src}') center/cover"></span>` : "");
  box.querySelectorAll("[data-scene]").forEach(el => el.addEventListener("click", () => {
    betState.bg = el.dataset.scene; renderBetScenePicker(); drawBetCard();
  }));
}

function renderBetSlips() {
  const box = document.getElementById("bet-slips");
  box.innerHTML = betSlips.map(s => `
    <div class="bet-slip" data-id="${s.id}">
      <img src="${s.img.src}" alt="slip">
      <div class="bet-slip-win">$ <input type="number" step="0.01" min="0" class="bet-win" data-id="${s.id}" value="${s.won || ""}" placeholder="won"></div>
      <button class="del bet-slip-del" data-id="${s.id}" title="Remove">✕</button>
    </div>`).join("");
  box.querySelectorAll(".bet-win").forEach(inp => inp.addEventListener("input", () => {
    const s = betSlips.find(x => x.id === inp.dataset.id); if (s) s.won = parseFloat(inp.value) || 0;
    updateBetTotal(); drawBetCard();
  }));
  box.querySelectorAll(".bet-slip-del").forEach(b => b.addEventListener("click", () => {
    betSlips = betSlips.filter(x => x.id !== b.dataset.id); renderBetSlips(); updateBetTotal(); drawBetCard();
  }));
  updateBetTotal();
}

const betTotalWon = () => betSlips.reduce((s, x) => s + (x.won || 0), 0);
function updateBetTotal() {
  document.getElementById("bet-total").textContent = fmtMoney(betTotalWon());
}

function addBetImages(files) {
  const list = [...files].filter(f => f.type.startsWith("image/"));
  let pending = list.length;
  for (const f of list) {
    const img = new Image();
    img.onload = () => { betSlips.push({ id: uid(), img, won: 0 }); if (--pending === 0) { renderBetSlips(); drawBetCard(); } };
    img.src = URL.createObjectURL(f);
  }
  if (!list.length) return;
}

/* drag & drop + browse */
const betDrop = document.getElementById("bet-drop");
betDrop.addEventListener("click", () => document.getElementById("bet-file").click());
document.getElementById("bet-file").addEventListener("change", e => { addBetImages(e.target.files); e.target.value = ""; });
["dragenter", "dragover"].forEach(ev => betDrop.addEventListener(ev, e => { e.preventDefault(); betDrop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev => betDrop.addEventListener(ev, e => { e.preventDefault(); betDrop.classList.remove("over"); }));
betDrop.addEventListener("drop", e => { if (e.dataTransfer.files) addBetImages(e.dataTransfer.files); });

document.getElementById("bet-bg-upload").addEventListener("change", e => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  const img = new Image();
  img.onload = () => { betCustomBg = img; betState.bg = "custom"; renderBetScenePicker(); drawBetCard(); };
  img.src = URL.createObjectURL(f);
});

document.getElementById("bet-title").addEventListener("input", drawBetCard);
document.getElementById("bet-handle").addEventListener("input", drawBetCard);

function betBgImage() {
  if (betState.bg === "custom") return betCustomBg;
  const img = betSceneImgs[betState.bg];
  return img && img.complete && img.naturalWidth ? img : null;
}

function drawBetCard() {
  const canvas = document.getElementById("bet-canvas");
  const W = 1080, H = 1350;
  if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  // background
  const bg = betBgImage();
  if (bg) {
    const scale = Math.max(W / bg.naturalWidth, H / bg.naturalHeight);
    const dw = bg.naturalWidth * scale, dh = bg.naturalHeight * scale;
    ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const sc = BET_SCENES.find(s => s.key === betState.bg) || BET_SCENES[0];
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, sc.grad[0]); g.addColorStop(1, sc.grad[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // scrims for legibility
  let s1 = ctx.createLinearGradient(0, 0, 0, H);
  s1.addColorStop(0, "rgba(0,0,0,0.55)"); s1.addColorStop(0.3, "rgba(0,0,0,0.15)");
  s1.addColorStop(0.75, "rgba(0,0,0,0.25)"); s1.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = s1; ctx.fillRect(0, 0, W, H);

  const F = 'Inter, "Segoe UI", system-ui, sans-serif';
  const shadow = () => { ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3; };
  const noShadow = () => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

  // title
  shadow();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = `800 58px ${F}`;
  ctx.fillText((document.getElementById("bet-title").value || "TODAY'S SLIPS").toUpperCase(), W / 2, 110);

  // total won
  const total = betTotalWon();
  ctx.font = `600 34px ${F}`; ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("TOTAL WON", W / 2, 180);
  ctx.font = `800 120px ${F}`;
  ctx.fillStyle = total >= 0 ? "#22e584" : "#ff5a5a";
  ctx.fillText((total >= 0 ? "+$" : "-$") + Math.abs(total).toLocaleString(undefined, { maximumFractionDigits: 2 }), W / 2, 300);
  noShadow();

  // slip grid
  const n = betSlips.length;
  if (n) {
    const cols = n === 1 ? 1 : 2;
    const rows = Math.ceil(n / cols);
    const gridTop = 350, gridBottom = H - 120, pad = 24, gap = 24;
    const cellW = (W - pad * 2 - gap * (cols - 1)) / cols;
    const cellH = Math.min((gridBottom - gridTop - gap * (rows - 1)) / rows, cellW * 1.35);
    betSlips.forEach((s, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = pad + c * (cellW + gap);
      const y = gridTop + r * (cellH + gap);
      // fit the WHOLE slip into the cell (no cropping), on a backing panel
      const imgH = cellH - 46;
      const img = s.img;
      roundRectPath(ctx, x, y, cellW, imgH, 14);
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fill();
      const scale = Math.min(cellW / img.naturalWidth, imgH / img.naturalHeight) * 0.96;
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (cellW - dw) / 2, y + (imgH - dh) / 2, dw, dh);
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.3)";
      roundRectPath(ctx, x, y, cellW, imgH, 14); ctx.stroke();
      // win caption
      ctx.textAlign = "center"; shadow();
      ctx.font = `700 30px ${F}`;
      ctx.fillStyle = (s.won || 0) >= 0 ? "#22e584" : "#ff5a5a";
      ctx.fillText((s.won ? "+$" + s.won.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"), x + cellW / 2, y + cellH - 8);
      noShadow();
    });
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = `600 34px ${F}`; ctx.textAlign = "center";
    ctx.fillText("drag your bet slips in ↑", W / 2, H / 2 + 80);
  }

  // footer
  shadow();
  ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = `800 40px ${F}`;
  ctx.fillText(document.getElementById("bet-handle").value || "@you", 40, H - 46);
  ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `600 28px ${F}`;
  ctx.fillText(new Date().toLocaleDateString(), W - 40, H - 48);
  noShadow();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

document.getElementById("bet-card-save").addEventListener("click", async () => {
  if (!betSlips.length) { document.getElementById("bet-card-status").textContent = "Drag in at least one bet slip first."; return; }
  if (document.fonts && document.fonts.load) { try { await document.fonts.load("800 120px Inter"); } catch {} }
  drawBetCard();
  document.getElementById("bet-canvas").toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bet-slips-${todayStr()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    document.getElementById("bet-card-status").textContent = `Saved — total won ${fmtMoney(betTotalWon())}.`;
  }, "image/png");
});

document.getElementById("bet-log-from-card").addEventListener("click", () => {
  if (!betSlips.length) return;
  const t = todayStr();
  betSlips.forEach((s, i) => {
    bets.push({ id: uid(), date: t, event: `Slip ${i + 1} (card)`, stake: 0, result: s.won > 0 ? "won" : "pending", payout: s.won || 0 });
  });
  store.save("life.bets", bets);
  renderBets();
  document.getElementById("bet-card-status").textContent = `Added ${betSlips.length} slip${betSlips.length === 1 ? "" : "s"} to your bet history.`;
});

/* ----- init ----- */
document.getElementById("bet-date").value = todayStr();
document.getElementById("bet-handle").value = (store.load("life.share", {}).name) || "";
renderBetScenePicker();
renderBetSlips();
renderBets();
