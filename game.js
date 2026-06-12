/* ============ Gamification: XP, levels, streaks, achievements ============ */
// Everything is computed from existing data (trades, food, goals, swaps),
// so history counts retroactively and nothing extra needs syncing.
// Only "which achievement toasts were already shown" is stored per device.

const LEVEL_TITLES = [
  [1, "Paper Hands"], [2, "Degen in Training"], [3, "Chart Watcher"],
  [4, "Candle Counter"], [5, "Disciplined Degen"], [6, "Swing Stepper"],
  [7, "Trend Rider"], [8, "Profit Taker"], [10, "Risk Manager"],
  [12, "Market Surgeon"], [14, "SOL Shark"], [16, "Alpha Hunter"],
  [18, "Whale"], [20, "Market Legend"], [25, "Final Boss"],
];

function levelTitle(level) {
  let title = LEVEL_TITLES[0][1];
  for (const [lv, t] of LEVEL_TITLES) if (level >= lv) title = t;
  return title;
}

function dateStrOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// consecutive calendar days satisfying hasDay, counting back from today
// (an unfinished today doesn't break the streak)
function calcStreak(hasDay) {
  const d = new Date();
  let streak = 0;
  if (hasDay(todayStr())) streak++;
  d.setDate(d.getDate() - 1);
  while (hasDay(dateStrOf(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function foodDayTotals() {
  const days = {};
  for (const f of food) days[f.date] = (days[f.date] || 0) + f.kcal;
  return days;
}

function greenStreak() {
  const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
  let n = 0;
  for (const tr of sorted) {
    if (tradeProfit(tr) > 0) n++;
    else break;
  }
  return n;
}

function bestDay() {
  let best = 0;
  for (const tr of trades) best = Math.max(best, tradeProfit(tr));
  return best;
}

function bestMonthSol() {
  const months = {};
  for (const tr of trades) {
    const m = tr.date.slice(0, 7);
    months[m] = (months[m] || 0) + tradeProfit(tr);
  }
  return Math.max(0, ...Object.values(months));
}

const ACHIEVEMENTS = [
  { id: "first-day", icon: "🩸", name: "First Blood", desc: "Log your first trading day", test: () => trades.length >= 1 },
  { id: "first-green", icon: "🌱", name: "Into the Green", desc: "Log a profitable day", test: () => trades.some(t => tradeProfit(t) > 0) },
  { id: "green5", icon: "🔥", name: "On Fire", desc: "5 green days in a row", test: () => greenStreak() >= 5 || maxGreenRun() >= 5 },
  { id: "green10", icon: "⚡", name: "Unstoppable", desc: "10 green days in a row", test: () => maxGreenRun() >= 10 },
  { id: "whale-day", icon: "🐋", name: "Whale Move", desc: "+100 SOL in a single day", test: () => bestDay() >= 100 },
  { id: "monster-month", icon: "👹", name: "Monster Month", desc: "+1,000 SOL in one month", test: () => bestMonthSol() >= 1000 },
  { id: "comeback", icon: "🦅", name: "Comeback Kid", desc: "Green day right after losing 50+ SOL", test: testComeback },
  { id: "log30", icon: "📒", name: "Iron Logger", desc: "Log 30 days total", test: () => trades.length >= 30 },
  { id: "log100", icon: "💯", name: "Centurion", desc: "Log 100 days total", test: () => trades.length >= 100 },
  { id: "log365", icon: "🗓️", name: "Year Grinder", desc: "Log 365 days total", test: () => trades.length >= 365 },
  { id: "swap10", icon: "🔄", name: "Swap Master", desc: "Log 10 swaps", test: () => swaps.length >= 10 },
  { id: "swap100k", icon: "💰", name: "Big Mover", desc: "$100k+ total swapped", test: () => swaps.reduce((s, x) => s + x.usd, 0) >= 100000 },
  { id: "first-meal", icon: "🍽️", name: "First Bite", desc: "Log your first meal", test: () => food.length >= 1 },
  { id: "food7", icon: "🥗", name: "Meal Tracker", desc: "Log food 7 days in a row", test: () => calcStreak(d => foodDayTotals()[d] != null) >= 7 },
  { id: "undergoal7", icon: "💪", name: "Discipline", desc: "7 days in a row under calorie goal", test: testUnderGoal7 },
  { id: "builder", icon: "🌯", name: "Master Builder", desc: "Log a meal with the meal builder", test: () => food.some(f => f.name.includes(" — ")) },
  { id: "goal1", icon: "🎯", name: "Goal Getter", desc: "Complete a goal", test: () => goals.some(g => g.current >= g.target) },
  { id: "goal-all", icon: "👑", name: "Overachiever", desc: "Complete 4 goals", test: () => goals.filter(g => g.current >= g.target).length >= 4 },
];

function maxGreenRun() {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let run = 0, best = 0;
  for (const tr of sorted) {
    run = tradeProfit(tr) > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

function testComeback() {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < sorted.length; i++) {
    if (tradeProfit(sorted[i - 1]) <= -50 && tradeProfit(sorted[i]) > 0) return true;
  }
  return false;
}

function testUnderGoal7() {
  const days = foodDayTotals();
  const sorted = Object.keys(days).sort();
  let run = 0, best = 0, prev = null;
  for (const d of sorted) {
    const consecutive = prev && (new Date(d + "T12:00") - new Date(prev + "T12:00")) === 86400000;
    run = days[d] <= settings.calGoal ? (consecutive ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    prev = d;
  }
  return best >= 7;
}

function calcGame() {
  const days = foodDayTotals();
  let xp = 0;
  for (const tr of trades) {
    xp += 10;
    const p = tradeProfit(tr);
    if (p > 0) xp += 15;
    if (p >= 50) xp += 10;
  }
  for (const d in days) {
    xp += 5;
    if (days[d] <= settings.calGoal) xp += 10;
  }
  xp += swaps.length * 5;
  xp += goals.filter(g => g.current >= g.target).length * 200;
  const unlocked = ACHIEVEMENTS.filter(a => { try { return a.test(); } catch { return false; } });
  xp += unlocked.length * 50;

  const level = Math.floor(Math.sqrt(xp / 75)) + 1;
  const base = 75 * (level - 1) ** 2;
  const next = 75 * level ** 2;
  return { xp, level, base, next, unlocked };
}

/* ----- toasts for new unlocks ----- */
let gameSeen = store.load("life.gameSeen", null);

function showToast(html) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = html;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 30);
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 4500);
}

function renderGame() {
  const g = calcGame();

  // header badge
  document.getElementById("level-badge").textContent = `🏆 Lv ${g.level}`;

  // overview streak chips
  const days = foodDayTotals();
  const streaks = [
    { icon: "🔥", label: "logging streak", n: calcStreak(d => trades.some(t => t.date === d)) },
    { icon: "📈", label: "green days", n: greenStreak() },
    { icon: "🍎", label: "food logged", n: calcStreak(d => days[d] != null) },
    { icon: "💪", label: "under cal goal", n: calcStreak(d => days[d] != null && days[d] <= settings.calGoal) },
  ];
  document.getElementById("dash-streaks").innerHTML = streaks.map(s => `
    <span class="streak-chip ${s.n > 0 ? "lit" : ""}">${s.icon} <strong>${s.n}</strong>&nbsp;${s.label}</span>`).join("");

  // arcade: level panel
  const pct = Math.min(100, ((g.xp - g.base) / (g.next - g.base)) * 100);
  document.getElementById("game-level").innerHTML = `
    <div class="level-num">Lv ${g.level}</div>
    <div style="flex:1;min-width:200px">
      <div class="level-title">${levelTitle(g.level)}</div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="muted" style="font-size:12px">${g.xp.toLocaleString()} XP · ${(g.next - g.xp).toLocaleString()} to Lv ${g.level + 1}</div>
    </div>`;

  // arcade: daily quests
  const t = todayStr();
  const todayTrade = trades.find(x => x.date === t);
  const todayCals = days[t];
  const quests = [
    { name: "Log today's trading day", done: !!todayTrade, xp: 10 },
    { name: "End the day green", done: !!todayTrade && tradeProfit(todayTrade) > 0, xp: 15 },
    { name: "Log your meals", done: todayCals != null, xp: 5 },
    { name: "Stay under your calorie goal", done: todayCals != null && todayCals <= settings.calGoal, xp: 10 },
  ];
  const qDone = quests.filter(q => q.done).length;
  document.getElementById("game-quests").innerHTML = `
    <div class="muted" style="margin-bottom:10px">${qDone} / ${quests.length} complete</div>
    ${quests.map(q => `
      <div class="quest ${q.done ? "done" : ""}">
        <span class="qcheck">${q.done ? "✅" : "⬜"}</span> ${q.name}
        <span class="kcal">+${q.xp} XP</span>
      </div>`).join("")}`;

  // arcade: streak detail
  document.getElementById("game-streaks").innerHTML = streaks.map(s => `
    <div class="quest ${s.n > 0 ? "done" : ""}">
      <span class="qcheck">${s.icon}</span> ${s.label}
      <span class="kcal"><strong>${s.n}</strong> day${s.n === 1 ? "" : "s"}</span>
    </div>`).join("");

  // arcade: achievements
  const unlockedIds = new Set(g.unlocked.map(a => a.id));
  document.getElementById("game-achievements").innerHTML = ACHIEVEMENTS.map(a => `
    <div class="ach ${unlockedIds.has(a.id) ? "unlocked" : ""}">
      <div class="ach-icon">${unlockedIds.has(a.id) ? a.icon : "🔒"}</div>
      <div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
    </div>`).join("");
  document.getElementById("ach-count").textContent = `${unlockedIds.size} / ${ACHIEVEMENTS.length}`;

  // toast newly unlocked (skip the very first render on a fresh device)
  if (gameSeen === null) {
    gameSeen = [...unlockedIds];
    store.save("life.gameSeen", gameSeen);
  } else {
    const fresh = [...unlockedIds].filter(id => !gameSeen.includes(id));
    if (fresh.length) {
      for (const id of fresh.slice(0, 3)) {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        showToast(`<span style="font-size:22px">${a.icon}</span> <strong>Achievement unlocked!</strong><br>${a.name} — ${a.desc}`);
      }
      gameSeen = [...new Set([...gameSeen, ...fresh])];
      store.save("life.gameSeen", gameSeen);
    }
  }
}

document.getElementById("level-badge").addEventListener("click", () => {
  document.querySelector('nav button[data-tab="arcade"]').click();
});

renderGame();
