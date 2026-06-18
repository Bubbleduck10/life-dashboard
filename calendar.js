/* ============ PnL Calendar image generator ============ */
// Draws the viewed month's trading profits onto a canvas (green/red day cells,
// header totals, best-streak footer) and lets the user save it as a PNG to share.

let calUnit = "coin"; // "coin" (SOL/native amount) or "usd"

function calMonthCoins(monthPrefix) {
  return [...new Set(trades.filter(t => t.date.startsWith(monthPrefix)).map(t => tradeCoin(t)))];
}

function calUnitLabel() {
  if (calUnit === "usd") return "USD";
  const coins = calMonthCoins(viewMonth);
  return coins.length <= 1 ? (coins[0] || "SOL") : "Coin";
}

function calValue(t) {
  return calUnit === "usd" ? (usdForTrade(t) ?? 0) : tradeProfit(t);
}

function calFmt(v) {
  if (calUnit === "usd") return (v >= 0 ? "+$" : "-$") + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "") + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function drawCalendar() {
  const canvas = document.getElementById("cal-canvas");
  const ctx = canvas.getContext("2d");
  const [y, m] = viewMonth.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstOffset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon = 0
  const weeks = Math.ceil((firstOffset + daysInMonth) / 7);

  // layout (logical px; exported at 2x for sharpness)
  const W = 760, pad = 18;
  const headerH = 96, weekdayH = 30, footerH = 46;
  const gridTop = headerH + weekdayH;
  const cellW = (W - pad * 2) / 7;
  const cellH = 78;
  const H = gridTop + weeks * cellH + footerH;

  const scale = 2;
  canvas.width = W * scale; canvas.height = H * scale;
  canvas.style.width = W + "px"; canvas.style.maxWidth = "100%";
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const GREEN = "#34d399", RED = "#f87171", MUTED = "#9aa3b2", TEXT = "#e8eaf0";
  const font = (px, w = 400) => `${w} ${px}px "Segoe UI", system-ui, sans-serif`;

  // map day -> trade
  const byDay = {};
  trades.filter(t => t.date.startsWith(viewMonth)).forEach(t => { byDay[+t.date.slice(8, 10)] = t; });

  // stats
  let net = 0, gC = 0, gS = 0, rC = 0, rS = 0, maxAbs = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const t = byDay[d]; if (!t) continue;
    const v = calValue(t); net += v;
    if (v > 0) { gC++; gS += v; } else if (v < 0) { rC++; rS += v; }
    maxAbs = Math.max(maxAbs, Math.abs(v));
  }
  // best positive streak over trading days, in date order
  let run = 0, best = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const t = byDay[d]; if (!t) continue;
    if (calValue(t) > 0) { run++; best = Math.max(best, run); } else run = 0;
  }

  // background
  ctx.fillStyle = "#0d0f14"; ctx.fillRect(0, 0, W, H);

  // header
  const unit = calUnitLabel();
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = TEXT; ctx.font = font(20, 700); ctx.textAlign = "left";
  ctx.fillText("PnL Calendar", pad, 34);
  ctx.fillStyle = MUTED; ctx.font = font(15, 600); ctx.textAlign = "center";
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  ctx.fillText(monthName + "  ·  " + unit, W / 2, 30);
  // net total
  ctx.fillStyle = net > 0 ? GREEN : net < 0 ? RED : MUTED;
  ctx.font = font(26, 800); ctx.textAlign = "left";
  ctx.fillText(calFmt(net), pad, 70);

  // green / red tallies
  ctx.font = font(14, 600); ctx.textAlign = "left";
  ctx.fillStyle = GREEN;
  ctx.fillText(`▲ ${gC} green   ${calFmt(gS)}`, pad, 90);
  ctx.textAlign = "right"; ctx.fillStyle = RED;
  ctx.fillText(`${calFmt(rS)}   ${rC} red ▼`, W - pad, 90);

  // weekday labels
  const wd = ["M", "T", "W", "T", "F", "S", "S"];
  ctx.fillStyle = MUTED; ctx.font = font(12, 600); ctx.textAlign = "center";
  for (let i = 0; i < 7; i++) ctx.fillText(wd[i], pad + cellW * i + cellW / 2, headerH + 20);

  // grid cells
  const rr = (x, yy, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, yy); ctx.arcTo(x + w, yy, x + w, yy + h, r);
    ctx.arcTo(x + w, yy + h, x, yy + h, r); ctx.arcTo(x, yy + h, x, yy, r);
    ctx.arcTo(x, yy, x + w, yy, r); ctx.closePath();
  };
  for (let d = 1; d <= daysInMonth; d++) {
    const idx = firstOffset + d - 1;
    const col = idx % 7, row = Math.floor(idx / 7);
    const x = pad + col * cellW + 3, yy = gridTop + row * cellH + 3;
    const w = cellW - 6, h = cellH - 6;
    const t = byDay[d];
    const v = t ? calValue(t) : null;
    // cell background tint
    let fill = "rgba(255,255,255,0.025)", stroke = "rgba(255,255,255,0.06)";
    if (v !== null && v !== 0) {
      const a = 0.10 + 0.45 * (maxAbs ? Math.abs(v) / maxAbs : 0);
      fill = v > 0 ? `rgba(52,211,153,${a})` : `rgba(248,113,113,${a})`;
      stroke = v > 0 ? "rgba(52,211,153,0.5)" : "rgba(248,113,113,0.5)";
    }
    rr(x, yy, w, h, 8); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke();
    // day number
    ctx.fillStyle = MUTED; ctx.font = font(11, 600); ctx.textAlign = "left";
    ctx.fillText(String(d), x + 8, yy + 18);
    // value
    if (v === null) {
      ctx.fillStyle = "rgba(154,163,178,0.4)"; ctx.font = font(13, 600); ctx.textAlign = "center";
      ctx.fillText("—", x + w / 2, yy + h / 2 + 9);
    } else {
      ctx.fillStyle = v > 0 ? GREEN : v < 0 ? RED : MUTED;
      ctx.font = font(15, 700); ctx.textAlign = "center";
      ctx.fillText(calFmt(v), x + w / 2, yy + h / 2 + 11);
    }
  }

  // footer
  ctx.fillStyle = MUTED; ctx.font = font(13, 600); ctx.textAlign = "left";
  ctx.fillText(`Best positive streak: ${best} day${best === 1 ? "" : "s"}`, pad, H - 18);
  ctx.fillStyle = "#6d6cff"; ctx.font = font(13, 800); ctx.textAlign = "right";
  ctx.fillText("🌟 Life Dashboard", W - pad, H - 18);

  document.getElementById("cal-month").textContent = monthName;
  document.getElementById("cal-unit").textContent = unit;
}

function openCalendar() {
  document.getElementById("cal-modal").style.display = "flex";
  drawCalendar();
}
function closeCalendar() { document.getElementById("cal-modal").style.display = "none"; }

document.getElementById("cal-open").addEventListener("click", openCalendar);
document.getElementById("cal-close").addEventListener("click", closeCalendar);
document.getElementById("cal-modal").addEventListener("click", e => {
  if (e.target.id === "cal-modal") closeCalendar();
});
document.getElementById("cal-prev").addEventListener("click", () => { shiftMonth(-1); drawCalendar(); });
document.getElementById("cal-next").addEventListener("click", () => { shiftMonth(1); drawCalendar(); });
document.getElementById("cal-unit").addEventListener("click", () => {
  calUnit = calUnit === "coin" ? "usd" : "coin";
  drawCalendar();
});
document.getElementById("cal-download").addEventListener("click", () => {
  const canvas = document.getElementById("cal-canvas");
  canvas.toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pnl-calendar-${viewMonth}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
});
