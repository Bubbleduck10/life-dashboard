/* ============ PnL Share Card (image / video background) ============ */
// Draws a big PnL figure over a chosen background (preset gradient, uploaded
// image, or uploaded video) with username + brand line, green for gain / red
// for loss. Exports a PNG, or records a short .webm when a video is used.

const SHARE_PRESETS = {
  sky:    ["#7ec8ff", "#2a6fd6"],
  green:  ["#0b3d2e", "#16a34a"],
  red:    ["#3d0b1c", "#e11d63"],
  sunset: ["#ff8c42", "#7b2ff7"],
  dark:   ["#1a1f2b", "#0a0c11"],
};
const COIN_GLYPH = { SOL: "◎", ETH: "Ξ", BTC: "₿", USDC: "$" };

let shareState = {
  period: "monthly", date: todayStr(), coin: "SOL", unit: "coin",
  bg: { type: "gradient", key: "sky" },
};
let shareImg = null, shareVideo = null, shareRAF = null, shareRecording = false;
let sharePrefs = store.load("life.share", { name: "", handle: "axiom.trade/icy" });

function sharePeriodData() {
  const coin = shareState.coin;
  let entries;
  if (shareState.period === "daily") {
    entries = trades.filter(t => t.date === shareState.date && tradeCoin(t) === coin);
  } else {
    entries = trades.filter(t => t.date.startsWith(viewMonth) && tradeCoin(t) === coin)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  const label = shareState.period === "daily"
    ? new Date(shareState.date + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })
    : new Date(viewMonth + "-01T12:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (!entries.length) return { label, coin, empty: true };

  const start = entries[0].startSol;
  const end = entries[entries.length - 1].endSol;
  const profit = end - start;
  const pct = start ? (profit / start) * 100 : null;
  if (shareState.unit === "usd") {
    const p0 = histPrice(coin, entries[0].date) || 0;
    const p1 = histPrice(coin, entries[entries.length - 1].date) || 0;
    const usdProfit = entries.reduce((s, t) => s + (usdForTrade(t) ?? 0), 0);
    return { label, coin, start: start * p0, end: end * p1, profit: usdProfit, pct, usd: true };
  }
  return { label, coin, start, end, profit, pct, usd: false };
}

function shareFmt(v, usd) {
  if (usd) return (v >= 0 ? "+$" : "-$") + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function drawShareBackground(ctx, W, H) {
  if (shareState.bg.type === "image" && shareImg) {
    drawCover(ctx, shareImg, W, H);
  } else if (shareState.bg.type === "video" && shareVideo && shareVideo.readyState >= 2) {
    drawCover(ctx, shareVideo, W, H);
  } else {
    const [c0, c1] = SHARE_PRESETS[shareState.bg.key] || SHARE_PRESETS.sky;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // legibility scrim (stronger on the left where text sits)
  const scrim = ctx.createLinearGradient(0, 0, W, 0);
  scrim.addColorStop(0, "rgba(0,0,0,0.62)");
  scrim.addColorStop(0.55, "rgba(0,0,0,0.25)");
  scrim.addColorStop(1, "rgba(0,0,0,0.05)");
  ctx.fillStyle = scrim; ctx.fillRect(0, 0, W, H);
  const bottom = ctx.createLinearGradient(0, H * 0.6, 0, H);
  bottom.addColorStop(0, "rgba(0,0,0,0)"); bottom.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = bottom; ctx.fillRect(0, 0, W, H);
}

function drawCover(ctx, src, W, H) {
  const sw = src.videoWidth || src.naturalWidth || src.width;
  const sh = src.videoHeight || src.naturalHeight || src.height;
  if (!sw || !sh) return;
  const scale = Math.max(W / sw, H / sh);
  const dw = sw * scale, dh = sh * scale;
  ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

function drawShareCard() {
  const canvas = document.getElementById("share-canvas");
  const ctx = canvas.getContext("2d");
  const W = 1200, H = 800;
  if (canvas.width !== W) { canvas.width = W; canvas.height = H; canvas.style.width = "100%"; canvas.style.maxWidth = W + "px"; }

  const d = sharePeriodData();
  drawShareBackground(ctx, W, H);

  const GREEN = "#22c55e", RED = "#ef4444", WHITE = "#ffffff";
  const gain = !d.empty && d.profit >= 0;
  const accent = d.empty ? "#64748b" : gain ? GREEN : RED;
  const shadow = () => { ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2; };
  const noShadow = () => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

  // period label
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; shadow();
  ctx.fillStyle = WHITE; ctx.font = '600 46px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(d.label, 60, 150);

  if (d.empty) {
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = '700 60px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("No trades this " + shareState.period.replace("ly", ""), 60, 280);
  } else {
    // big PnL pill
    const glyph = shareState.unit === "usd" ? "$" : (COIN_GLYPH[d.coin] || d.coin);
    const bigText = `${shareState.unit === "usd" ? "" : glyph + " "}${(d.profit >= 0 ? "+" : "") + shareFmt(d.profit, d.usd)}`;
    ctx.font = '800 96px "Segoe UI", system-ui, sans-serif';
    const tw = ctx.measureText(bigText).width;
    const pillX = 50, pillY = 190, pillH = 128, pillW = tw + 72;
    noShadow();
    roundRect(ctx, pillX, pillY, pillW, pillH, 16); ctx.fillStyle = accent; ctx.fill();
    ctx.fillStyle = WHITE; ctx.textBaseline = "middle";
    ctx.fillText(bigText, pillX + 36, pillY + pillH / 2 + 4);
    ctx.textBaseline = "alphabetic";

    // detail rows
    shadow();
    const rows = [
      ["PNL", d.pct == null ? "—" : (d.pct >= 0 ? "+" : "") + d.pct.toFixed(0) + "%", accent],
      ["Start Balance", shareState.unit === "usd" ? "$" + d.start.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (COIN_GLYPH[d.coin] || "") + " " + d.start.toLocaleString(undefined, { maximumFractionDigits: 2 }), WHITE],
      ["End Balance", shareState.unit === "usd" ? "$" + d.end.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (COIN_GLYPH[d.coin] || "") + " " + d.end.toLocaleString(undefined, { maximumFractionDigits: 2 }), WHITE],
    ];
    let ry = 430;
    for (const [lab, val, col] of rows) {
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = '600 38px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(lab, 60, ry);
      ctx.fillStyle = col; ctx.font = '700 38px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(val, 430, ry);
      ry += 60;
    }
  }

  // bottom-left branding
  shadow();
  ctx.fillStyle = WHITE; ctx.font = '800 44px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(sharePrefs.name || "@you", 60, H - 90);
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = '600 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText("🌐 " + (sharePrefs.handle || "axiom.trade/icy"), 60, H - 48);
  noShadow();

  document.getElementById("share-record").style.display = shareState.bg.type === "video" && shareVideo ? "" : "none";
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function shareLoop() {
  drawShareCard();
  if (shareState.bg.type === "video" && shareVideo) shareRAF = requestAnimationFrame(shareLoop);
}
function stopShareLoop() { if (shareRAF) { cancelAnimationFrame(shareRAF); shareRAF = null; } }

/* ----- UI wiring ----- */
function renderSharePresets() {
  const box = document.getElementById("share-presets");
  box.innerHTML = Object.keys(SHARE_PRESETS).map(k =>
    `<span class="share-swatch ${shareState.bg.type === "gradient" && shareState.bg.key === k ? "on" : ""}" data-preset="${k}"
       style="background:linear-gradient(135deg,${SHARE_PRESETS[k][0]},${SHARE_PRESETS[k][1]})"></span>`).join("");
  box.querySelectorAll("[data-preset]").forEach(el => el.addEventListener("click", () => {
    shareState.bg = { type: "gradient", key: el.dataset.preset };
    stopShareLoop(); renderSharePresets(); drawShareCard();
  }));
}

function openShare() {
  document.getElementById("share-modal").style.display = "flex";
  document.getElementById("share-name").value = sharePrefs.name;
  document.getElementById("share-handle").value = sharePrefs.handle;
  document.getElementById("share-date").value = shareState.date;
  renderSharePresets();
  drawShareCard();
}
function closeShare() { stopShareLoop(); document.getElementById("share-modal").style.display = "none"; }

document.getElementById("share-open").addEventListener("click", openShare);
document.getElementById("share-close").addEventListener("click", closeShare);
document.getElementById("share-modal").addEventListener("click", e => { if (e.target.id === "share-modal") closeShare(); });

document.getElementById("share-period").addEventListener("change", e => {
  shareState.period = e.target.value;
  document.getElementById("share-date-wrap").style.display = e.target.value === "daily" ? "" : "none";
  drawShareCard();
});
document.getElementById("share-date").addEventListener("change", e => { shareState.date = e.target.value; drawShareCard(); });
document.getElementById("share-coin").addEventListener("change", e => { shareState.coin = e.target.value; drawShareCard(); });
document.getElementById("share-unit").addEventListener("change", e => { shareState.unit = e.target.value; drawShareCard(); });

function savePrefs() {
  sharePrefs = { name: document.getElementById("share-name").value.trim(), handle: document.getElementById("share-handle").value.trim() };
  store.save("life.share", sharePrefs);
  drawShareCard();
}
document.getElementById("share-name").addEventListener("input", savePrefs);
document.getElementById("share-handle").addEventListener("input", savePrefs);

document.getElementById("share-img").addEventListener("change", e => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  const img = new Image();
  img.onload = () => { shareImg = img; shareState.bg = { type: "image" }; stopShareLoop(); renderSharePresets(); drawShareCard(); };
  img.src = URL.createObjectURL(file);
});

document.getElementById("share-vid").addEventListener("change", e => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  const v = document.createElement("video");
  v.src = URL.createObjectURL(file);
  v.muted = true; v.loop = true; v.playsInline = true;
  v.onloadeddata = () => { shareVideo = v; shareState.bg = { type: "video" }; v.play(); renderSharePresets(); stopShareLoop(); shareLoop(); };
});

document.getElementById("share-download").addEventListener("click", () => {
  drawShareCard();
  document.getElementById("share-canvas").toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pnl-${shareState.period}-${shareState.period === "daily" ? shareState.date : viewMonth}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
});

document.getElementById("share-record").addEventListener("click", async () => {
  if (shareRecording || !shareVideo) return;
  const canvas = document.getElementById("share-canvas");
  if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
    document.getElementById("share-status").textContent = "Your browser can't record video — use Save image instead.";
    return;
  }
  const type = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(t => MediaRecorder.isTypeSupported(t)) || "video/webm";
  shareRecording = true;
  document.getElementById("share-status").textContent = "Recording…";
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: type });
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
    a.download = `pnl-${shareState.period}-${shareState.period === "daily" ? shareState.date : viewMonth}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    shareRecording = false;
    document.getElementById("share-status").textContent = "Saved a .webm clip.";
  };
  shareVideo.currentTime = 0; await shareVideo.play();
  if (!shareRAF) shareLoop();
  rec.start();
  const dur = Math.min(shareVideo.duration && isFinite(shareVideo.duration) ? shareVideo.duration : 6, 8) * 1000;
  setTimeout(() => rec.stop(), dur);
});
