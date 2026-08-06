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
let shareImg = null, shareVideo = null, shareRAF = null, shareRecording = false, shareZoom = 0;
let sharePrefs = store.load("life.share", { name: "", handle: "axiom.trade/icy" });

function share7dStart() {
  const d = new Date(); d.setDate(d.getDate() - 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const shareFileBase = () => `pnl-${shareState.period === "daily" ? shareState.date : shareState.period === "7day" ? "last7d-" + todayStr() : viewMonth}`;

function sharePeriodData() {
  const coin = shareState.coin;
  const wk = share7dStart(), today = todayStr();
  const inPeriod = t => shareState.period === "daily" ? t.date === shareState.date
    : shareState.period === "7day" ? (t.date >= wk && t.date <= today)
    : t.date.startsWith(viewMonth);
  const fmtShort = ds => new Date(ds + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const label = shareState.period === "daily"
    ? new Date(shareState.date + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })
    : shareState.period === "7day"
    ? `${fmtShort(wk)} – ${fmtShort(today)}, ${new Date(today + "T12:00").getFullYear()}`
    : new Date(viewMonth + "-01T12:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // combined across every currency → everything valued in USD
  if (coin === "ALL") {
    const entries = trades.filter(inPeriod);
    if (!entries.length) return { label, coin, empty: true };
    const coins = [...new Set(entries.map(tradeCoin))];
    let startUSD = 0, endUSD = 0;
    const breakdown = {};
    for (const c of coins) {
      const ce = entries.filter(t => tradeCoin(t) === c).sort((a, b) => a.date.localeCompare(b.date));
      startUSD += ce[0].startSol * (histPrice(c, ce[0].date) || 0);
      endUSD += ce[ce.length - 1].endSol * (histPrice(c, ce[ce.length - 1].date) || 0);
      breakdown[c] = ce.reduce((s, t) => s + (t.endSol - t.startSol), 0);
    }
    const profit = entries.reduce((s, t) => s + (usdForTrade(t) ?? 0), 0);
    const pct = startUSD ? (profit / startUSD) * 100 : null;
    return { label, coin: "ALL", usd: true, all: true, start: startUSD, end: endUSD, profit, pct, breakdown };
  }

  const entries = trades.filter(t => inPeriod(t) && tradeCoin(t) === coin).sort((a, b) => a.date.localeCompare(b.date));
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

// always includes exactly one sign, so callers must NOT add their own "+"
function shareFmt(v, usd) {
  if (usd) return (v >= 0 ? "+$" : "-$") + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "") + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/* ----- currency marks drawn on the canvas ----- */
const coinTokenCache = {};
function coinToken(sym, size, color) {
  const key = sym + "|" + size + "|" + color;
  if (coinTokenCache[key]) return coinTokenCache[key];
  const c = document.createElement("canvas"); c.width = size; c.height = size;
  const x = c.getContext("2d");
  x.fillStyle = color; x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = "destination-out";
  x.font = `800 ${Math.round(size * 0.62)}px Inter, "Segoe UI", system-ui, sans-serif`;
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(sym, size / 2, size / 2 + size * 0.03);
  coinTokenCache[key] = c;
  return c;
}
// Official Solana mark (three-bar gradient logo), embedded as a vector image
const SOL_LOGO_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 398 312'>" +
  "<defs><linearGradient id='sg' x1='370' y1='0' x2='30' y2='312' gradientUnits='userSpaceOnUse'>" +
  "<stop stop-color='#14F195'/><stop offset='1' stop-color='#9945FF'/></linearGradient></defs>" +
  "<path fill='url(#sg)' d='M64.6004 237.909C67.0627 235.447 70.4331 234.036 74.0034 234.036H392.404C398.318 234.036 401.275 241.19 397.093 245.373L334.395 308.07C331.933 310.532 328.562 311.943 324.992 311.943H6.59161C0.678185 311.943 -2.27942 304.789 1.90271 300.607L64.6004 237.909Z'/>" +
  "<path fill='url(#sg)' d='M64.6004 3.87401C67.1626 1.41172 70.5331 0.000762939 74.0034 0.000762939H392.404C398.318 0.000762939 401.275 7.15466 397.093 11.3368L334.395 74.0345C331.933 76.4967 328.562 77.9077 324.992 77.9077H6.59161C0.678185 77.9077 -2.27942 70.7538 1.90271 66.5717L64.6004 3.87401Z'/>" +
  "<path fill='url(#sg)' d='M334.395 120.842C331.933 118.38 328.562 116.969 324.992 116.969H6.59161C0.678185 116.969 -2.27942 124.123 1.90271 128.305L64.6004 191.003C67.0627 193.465 70.4331 194.876 74.0034 194.876H392.404C398.318 194.876 401.275 187.722 397.093 183.54L334.395 120.842Z'/>" +
  "</svg>";
const solLogoImg = new Image();
solLogoImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SOL_LOGO_SVG);
solLogoImg.onload = () => { if (typeof drawShareCard === "function" && document.getElementById("share-modal") && document.getElementById("share-modal").style.display === "flex") drawShareCard(); };

function drawSolMark(ctx, x, y, s, color) {
  // Solana-style mark: three sheared bars with the signature offset flow
  // (top shifted right, bottom shifted left). Single fill → takes any color.
  ctx.fillStyle = color;
  const w = s, bh = s * 0.245, gap = (s - 3 * bh) / 2, k = s * 0.30, off = s * 0.14;
  const offs = [off * 2, off, 0]; // top → right, bottom → left
  for (let i = 0; i < 3; i++) {
    const by = y + i * (bh + gap);
    const ox = x + offs[i];
    ctx.beginPath();
    ctx.moveTo(ox + k, by); ctx.lineTo(ox + w, by);
    ctx.lineTo(ox + w - k, by + bh); ctx.lineTo(ox, by + bh);
    ctx.closePath(); ctx.fill();
  }
}
function drawEthMark(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  const cx = x + s * 0.45, w = s * 0.9;
  ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(x + w, y + s * 0.55); ctx.lineTo(cx, y + s * 0.7); ctx.lineTo(x, y + s * 0.55); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + s * 0.03, y + s * 0.6); ctx.lineTo(cx, y + s); ctx.lineTo(x + w - s * 0.03, y + s * 0.6); ctx.closePath(); ctx.fill();
}
function drawBnbMark(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  const cx = x + s / 2, cy = y + s / 2, d = s * 0.31, h = s * 0.15;
  const dia = (px, py, hh) => { ctx.beginPath(); ctx.moveTo(px, py - hh); ctx.lineTo(px + hh, py); ctx.lineTo(px, py + hh); ctx.lineTo(px - hh, py); ctx.closePath(); ctx.fill(); };
  dia(cx, cy, h * 1.2); // center
  dia(cx, cy - d, h); dia(cx, cy + d, h); dia(cx - d, cy, h); dia(cx + d, cy, h); // N/E/S/W
}
const coinIconWidth = (coin, s) => coin === "SOL" ? s * 1.276 : coin === "ETH" ? s * 0.9 : s;
function drawCoinIcon(ctx, coin, x, y, s, color) {
  if (coin === "SOL") {
    if (solLogoImg.complete && solLogoImg.naturalWidth) ctx.drawImage(solLogoImg, x, y, s * 1.276, s);
    else drawSolMark(ctx, x, y, s, color); // vector fallback until the logo loads
    return;
  }
  if (coin === "ETH") { drawEthMark(ctx, x, y, s, color); return; }
  if (coin === "BNB") { drawBnbMark(ctx, x, y, s, color); return; }
  const sym = coin === "BTC" ? "₿" : coin === "USDC" ? "$" : (coin[0] || "$");
  ctx.drawImage(coinToken(sym, Math.round(s), color), x, y, s, s);
}

function drawShareBackground(ctx, W, H) {
  if (shareState.bg.type === "image" && shareImg) {
    drawCover(ctx, shareImg, W, H, shareZoom);
  } else if (shareState.bg.type === "video" && shareVideo && shareVideo.readyState >= 2) {
    drawCover(ctx, shareVideo, W, H, 0);
  } else {
    const [c0, c1] = SHARE_PRESETS[shareState.bg.key] || SHARE_PRESETS.sky;
    // slow drift on the gradient angle so a static-background clip still moves
    const a = shareZoom * Math.PI;
    const g = ctx.createLinearGradient(0, 0, W * Math.cos(a * 0.15 + 0.2), H);
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

function drawCover(ctx, src, W, H, zoom = 0) {
  const sw = src.videoWidth || src.naturalWidth || src.width;
  const sh = src.videoHeight || src.naturalHeight || src.height;
  if (!sw || !sh) return;
  const scale = Math.max(W / sw, H / sh) * (1 + 0.07 * zoom); // slow Ken-Burns zoom
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
  ctx.fillStyle = WHITE; ctx.font = '600 46px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.fillText(d.label, 60, 150);

  if (d.empty) {
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = '700 60px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.fillText(shareState.period === "7day" ? "No trades in the last 7 days" : shareState.period === "daily" ? "No trades this day" : "No trades this month", 60, 280);
  } else {
    // big PnL pill with the coin's mark (single sign — shareFmt owns it)
    const usd = d.usd;
    const numText = shareFmt(d.profit, usd);
    ctx.font = '800 96px Inter, "Segoe UI", system-ui, sans-serif';
    const numW = ctx.measureText(numText).width;
    const showIcon = !usd; // coin modes show the logo; USD/All already carry "$"
    const iconS = 66;
    const iconW = showIcon ? coinIconWidth(d.coin, iconS) : 0;
    const iconGap = showIcon ? 20 : 0;
    const pillX = 50, pillY = 190, pillH = 128, pillW = iconW + iconGap + numW + 72;
    noShadow();
    roundRect(ctx, pillX, pillY, pillW, pillH, 16); ctx.fillStyle = accent; ctx.fill();
    const cy = pillY + pillH / 2;
    let cx = pillX + 36;
    if (showIcon) { drawCoinIcon(ctx, d.coin, cx, cy - iconS / 2, iconS, WHITE); cx += iconW + iconGap; }
    ctx.fillStyle = WHITE; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(numText, cx, cy + 4);
    ctx.textBaseline = "alphabetic";

    // detail rows (small coin mark before balances in coin mode)
    shadow();
    const rows = [
      { lab: "PNL", val: d.pct == null ? "—" : (d.pct >= 0 ? "+" : "") + d.pct.toFixed(0) + "%", col: accent, icon: false },
      { lab: "Start Balance", num: d.start, col: WHITE, icon: !usd },
      { lab: "End Balance", num: d.end, col: WHITE, icon: !usd },
    ];
    let ry = 430;
    for (const r of rows) {
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = '600 38px Inter, "Segoe UI", system-ui, sans-serif';
      ctx.fillText(r.lab, 60, ry);
      ctx.font = '700 38px Inter, "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = r.col;
      let vx = 430;
      if (r.icon) { const is = 30; drawCoinIcon(ctx, d.coin, vx, ry - 27, is, r.col); vx += coinIconWidth(d.coin, is) + 10; }
      const valStr = r.val !== undefined ? r.val : (usd ? "$" : "") + r.num.toLocaleString(undefined, { maximumFractionDigits: 2 });
      ctx.fillText(valStr, vx, ry);
      ry += 60;
    }
    // per-currency breakdown when combining All
    if (d.all) {
      const parts = Object.entries(d.breakdown)
        .map(([c, v]) => `${c} ${v >= 0 ? "+" : ""}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`).join("    ");
      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = '600 27px Inter, "Segoe UI", system-ui, sans-serif';
      ctx.fillText(parts, 60, ry + 6);
    }
  }

  // bottom-left branding
  shadow();
  ctx.fillStyle = WHITE; ctx.font = '800 44px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.fillText(sharePrefs.name || "@you", 60, H - 90);
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = '600 30px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.fillText("🌐 " + (sharePrefs.handle || "axiom.trade/icy"), 60, H - 48);
  noShadow();
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
    stopShareLoop(); renderSharePresets(); updateVideoOpts(); drawShareCard();
  }));
}

function syncUnitEnabled() {
  document.getElementById("share-unit").disabled = shareState.coin === "ALL";
}

// canvas ignores CSS font loading, so make sure Inter is ready before drawing
let shareFontsReady = false;
async function loadShareFonts() {
  if (shareFontsReady) return;
  if (document.fonts && document.fonts.load) {
    try {
      await Promise.all([
        document.fonts.load("800 96px Inter"),
        document.fonts.load("700 38px Inter"),
        document.fonts.load("600 46px Inter"),
        document.fonts.load("500 30px Inter"),
      ]);
    } catch {}
  }
  shareFontsReady = true;
}
loadShareFonts().then(() => {
  if (document.getElementById("share-modal").style.display === "flex") drawShareCard();
});

function openShare() {
  document.getElementById("share-modal").style.display = "flex";
  document.getElementById("share-name").value = sharePrefs.name;
  document.getElementById("share-handle").value = sharePrefs.handle;
  document.getElementById("share-date").value = shareState.date;
  document.getElementById("share-coin").value = shareState.coin;
  document.getElementById("share-unit").value = shareState.unit;
  document.getElementById("share-period").value = shareState.period;
  document.getElementById("share-date-wrap").style.display = shareState.period === "daily" ? "" : "none";
  syncUnitEnabled();
  renderSharePresets();
  updateVideoOpts();
  drawShareCard();
  loadShareFonts().then(() => { if (document.getElementById("share-modal").style.display === "flex") drawShareCard(); });
}
function closeShare() {
  stopShareLoop();
  if (shareVideo && !shareRecording) shareVideo.muted = true;
  document.getElementById("share-modal").style.display = "none";
}

document.getElementById("share-open").addEventListener("click", openShare);
document.getElementById("share-close").addEventListener("click", closeShare);
document.getElementById("share-modal").addEventListener("click", e => { if (e.target.id === "share-modal") closeShare(); });

document.getElementById("share-period").addEventListener("change", e => {
  shareState.period = e.target.value;
  document.getElementById("share-date-wrap").style.display = e.target.value === "daily" ? "" : "none";
  drawShareCard();
});
document.getElementById("share-date").addEventListener("change", e => { shareState.date = e.target.value; drawShareCard(); });
document.getElementById("share-coin").addEventListener("change", e => { shareState.coin = e.target.value; syncUnitEnabled(); drawShareCard(); });
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
  img.onload = () => { shareImg = img; shareState.bg = { type: "image" }; stopShareLoop(); renderSharePresets(); updateVideoOpts(); drawShareCard(); };
  img.src = URL.createObjectURL(file);
});

function updateVideoOpts() {
  const on = shareState.bg.type === "video" && shareVideo;
  document.getElementById("share-vid-opts").style.display = on ? "" : "none";
}

document.getElementById("share-vid").addEventListener("change", e => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  const v = document.createElement("video");
  v.src = URL.createObjectURL(file);
  v.muted = true; v.loop = true; v.playsInline = true; // muted so the preview can autoplay
  v.onloadeddata = () => {
    shareVideo = v; shareState.bg = { type: "video" }; v.play();
    document.getElementById("share-preview-sound").textContent = "🔇 Hear preview";
    renderSharePresets(); updateVideoOpts(); stopShareLoop(); shareLoop();
  };
});

document.getElementById("share-preview-sound").addEventListener("click", () => {
  if (!shareVideo) return;
  shareVideo.muted = !shareVideo.muted;
  if (!shareVideo.muted) shareVideo.play().catch(() => {});
  document.getElementById("share-preview-sound").textContent = shareVideo.muted ? "🔇 Hear preview" : "🔊 Mute preview";
});

document.getElementById("share-download").addEventListener("click", async () => {
  await loadShareFonts();
  drawShareCard();
  document.getElementById("share-canvas").toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = shareFileBase() + ".png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
});

function downloadShareVideo(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

let ffmpegLib = null;
function loadScriptOnce(src) {
  return new Promise((res, rej) => {
    if ([...document.scripts].some(s => s.src === src)) return res();
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = () => res(); s.onerror = () => rej(new Error("load " + src));
    document.head.appendChild(s);
  });
}
async function getFFmpeg(status) {
  if (ffmpegLib) return ffmpegLib;
  status.textContent = "Loading MP4 converter (first time, ~30 MB)…";
  await loadScriptOnce("https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js");
  const { createFFmpeg, fetchFile } = window.FFmpeg;
  const ff = createFFmpeg({ log: false, corePath: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js" });
  ff.setProgress(({ ratio }) => { if (ratio >= 0 && ratio <= 1) status.textContent = `Converting to MP4… ${Math.round(ratio * 100)}%`; });
  await ff.load();
  ffmpegLib = { ff, fetchFile };
  return ffmpegLib;
}
// convert a recorded webm to MP4 in-browser (only used when native MP4 recording isn't available)
async function transcodeToMp4(webmBlob, baseName, status, btn) {
  btn.textContent = "Converting…";
  try {
    const { ff, fetchFile } = await getFFmpeg(status);
    ff.FS("writeFile", "in.webm", await fetchFile(webmBlob));
    await ff.run("-i", "in.webm", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "out.mp4");
    const data = ff.FS("readFile", "out.mp4");
    try { ff.FS("unlink", "in.webm"); ff.FS("unlink", "out.mp4"); } catch {}
    downloadShareVideo(new Blob([data.buffer], { type: "video/mp4" }), baseName + ".mp4");
    status.textContent = "Saved an MP4.";
  } catch {
    downloadShareVideo(webmBlob, baseName + ".webm");
    status.textContent = "MP4 conversion unavailable here — saved WebM instead.";
  }
}

document.getElementById("share-record").addEventListener("click", async () => {
  if (shareRecording) return;
  await loadShareFonts();
  const canvas = document.getElementById("share-canvas");
  const status = document.getElementById("share-status");
  const btn = document.getElementById("share-record");
  if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
    status.textContent = "This browser can't record video — use Save image instead."; return;
  }
  const hasVideo = shareState.bg.type === "video" && shareVideo;
  const wantSound = hasVideo && document.getElementById("share-sound").checked;
  const wantMp4 = document.getElementById("share-format").value === "mp4";

  // prefer native MP4 recording (modern browsers); else record webm
  const mp4Mimes = wantSound
    ? ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"]
    : ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1.42E01E", "video/mp4"];
  const webmMimes = wantSound
    ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  let container = "webm", type = null;
  if (wantMp4) { type = mp4Mimes.find(t => MediaRecorder.isTypeSupported(t)); if (type) container = "mp4"; }
  if (!type) type = webmMimes.find(t => MediaRecorder.isTypeSupported(t));
  if (!type) { status.textContent = "Video recording isn't supported here — use Save image."; return; }
  const needTranscode = wantMp4 && container === "webm"; // recorded webm, must convert to mp4

  shareRecording = true;
  stopShareLoop();
  btn.textContent = "● Recording…"; btn.disabled = true;
  status.textContent = "";

  // canvas video track + (optionally) the uploaded video's audio track
  const recStream = new MediaStream(canvas.captureStream(30).getVideoTracks());
  const wasMuted = hasVideo ? shareVideo.muted : true;
  if (wantSound) {
    try {
      shareVideo.muted = false; shareVideo.volume = 1;
      const cap = shareVideo.captureStream ? shareVideo.captureStream() : (shareVideo.mozCaptureStream ? shareVideo.mozCaptureStream() : null);
      const at = cap && cap.getAudioTracks()[0];
      if (at) recStream.addTrack(at);
    } catch { /* fall back to silent video */ }
  }

  const rec = new MediaRecorder(recStream, { mimeType: type });
  const chunks = [];
  const baseName = shareFileBase();
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = async () => {
    if (hasVideo) shareVideo.muted = wasMuted; // restore preview mute state
    if (hasVideo) { shareLoop(); } else { shareZoom = 0; drawShareCard(); }
    const blob = new Blob(chunks, { type: container === "mp4" ? "video/mp4" : "video/webm" });
    if (needTranscode) {
      await transcodeToMp4(blob, baseName, status, btn);
    } else {
      downloadShareVideo(blob, baseName + "." + container);
      status.textContent = `Saved a .${container} clip` + (wantSound ? " with sound" : "") + (container === "webm" ? ". (If a site won't accept .webm, pick MP4 above.)" : ".");
    }
    shareRecording = false;
    btn.textContent = "🎬 Save video"; btn.disabled = false;
  };

  const durMs = hasVideo
    ? Math.min(shareVideo.duration && isFinite(shareVideo.duration) ? shareVideo.duration : 6, 45) * 1000
    : 4000;
  if (hasVideo) { shareVideo.currentTime = 0; try { await shareVideo.play(); } catch {} }

  rec.start();
  const t0 = performance.now();
  // timer-driven (not rAF) so it still finishes if the tab loses focus
  const drawTimer = setInterval(() => {
    if (!hasVideo) shareZoom = Math.min(1, (performance.now() - t0) / durMs);
    drawShareCard();
  }, 1000 / 30);
  setTimeout(() => { clearInterval(drawTimer); if (hasVideo) shareVideo.pause(); try { rec.stop(); } catch {} }, durMs);
});
