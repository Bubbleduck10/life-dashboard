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

// a day is "green" by its net USD across all currencies logged that day
function greenStreak() {
  const dates = tradedDates().sort((a, b) => b.localeCompare(a));
  let n = 0;
  for (const d of dates) {
    if (dayNetUsd(d) > 0) n++;
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

/* ----- weekly challenges (Mon-Sun) ----- */
function weekRange(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7); // back to Monday
  const start = dateStrOf(d);
  const e = new Date(d);
  e.setDate(e.getDate() + 6);
  return { start, end: dateStrOf(e) };
}

function weekStats(start, end, days) {
  const wt = trades.filter(t => t.date >= start && t.date <= end);
  const dates = [...new Set(wt.map(t => t.date))]; // distinct trading days
  let foodDays = 0, under = 0;
  for (const d in days) {
    if (d >= start && d <= end) { foodDays++; if (days[d] <= settings.calGoal) under++; }
  }
  return {
    logged: dates.length,
    green: dates.filter(d => dayNetUsd(d) > 0).length,
    net: wt.reduce((s, t) => s + (usdForTrade(t) ?? 0), 0), // USD so mixed coins compare fairly
    foodDays, under,
  };
}

const WEEKLY_CHALLENGES = [
  { id: "wk-green", icon: "🟢", name: "Green Week", desc: "3 green days", xp: 75, target: 3, value: s => s.green },
  { id: "wk-log", icon: "📒", name: "Consistency", desc: "log 5 trading days", xp: 50, target: 5, value: s => s.logged },
  { id: "wk-net", icon: "🚀", name: "Finish Ahead", desc: "end the week net positive (3+ days)", xp: 100, target: 1, value: s => (s.net > 0 && s.logged >= 3) ? 1 : 0, detail: s => fmtMoney(s.net) },
  { id: "wk-food", icon: "🍎", name: "Fuel Log", desc: "log food on 4 days", xp: 50, target: 4, value: s => s.foodDays },
  { id: "wk-clean", icon: "💪", name: "Clean Week", desc: "3 days under calorie goal", xp: 75, target: 3, value: s => s.under },
];

// scan every week from the earliest data to now: XP for each completed
// challenge (history counts), and whether any week completed all five
function weeklyHistory(days) {
  const dates = [...trades.map(t => t.date), ...Object.keys(days)].sort();
  if (!dates.length) return { xp: 0, perfect: false };
  const cur = weekRange(0);
  let xp = 0, perfect = false;
  const d = new Date(dates[0] + "T12:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  while (dateStrOf(d) <= cur.start) {
    const start = dateStrOf(d);
    const e = new Date(d); e.setDate(e.getDate() + 6);
    const s = weekStats(start, dateStrOf(e), days);
    let done = 0;
    for (const ch of WEEKLY_CHALLENGES) {
      if (ch.value(s) >= ch.target) { xp += ch.xp; done++; }
    }
    if (done === WEEKLY_CHALLENGES.length) perfect = true;
    d.setDate(d.getDate() + 7);
  }
  return { xp, perfect };
}

const ACHIEVEMENTS = [
  { id: "perfect-week", icon: "🌟", name: "Perfect Week", desc: "Complete all 5 weekly challenges in one week", test: () => weeklyHistory(foodDayTotals()).perfect },
  { id: "first-day", icon: "🩸", name: "First Blood", desc: "Log your first trading day", test: () => trades.length >= 1 },
  { id: "first-green", icon: "🌱", name: "Into the Green", desc: "Log a profitable day", test: () => trades.some(t => tradeProfit(t) > 0) },
  { id: "green5", icon: "🔥", name: "On Fire", desc: "5 green days in a row", test: () => greenStreak() >= 5 || maxGreenRun() >= 5 },
  { id: "green10", icon: "⚡", name: "Unstoppable", desc: "10 green days in a row", test: () => maxGreenRun() >= 10 },
  { id: "whale-day", icon: "🐋", name: "Whale Move", desc: "+100 SOL in a single day", test: () => bestDay() >= 100 },
  { id: "monster-month", icon: "👹", name: "Monster Month", desc: "+1,000 SOL in one month", test: () => bestMonthSol() >= 1000 },
  { id: "comeback", icon: "🦅", name: "Comeback Kid", desc: "Green day right after losing 50+ SOL", test: testComeback },
  { id: "log30", icon: "📒", name: "Iron Logger", desc: "Log 30 days total", test: () => tradedDates().length >= 30 },
  { id: "log100", icon: "💯", name: "Centurion", desc: "Log 100 days total", test: () => tradedDates().length >= 100 },
  { id: "log365", icon: "🗓️", name: "Year Grinder", desc: "Log 365 days total", test: () => tradedDates().length >= 365 },
  { id: "swap10", icon: "🔄", name: "Swap Master", desc: "Log 10 swaps", test: () => swaps.length >= 10 },
  { id: "swap100k", icon: "💰", name: "Big Mover", desc: "$100k+ total swapped", test: () => swaps.reduce((s, x) => s + x.usd, 0) >= 100000 },
  { id: "first-meal", icon: "🍽️", name: "First Bite", desc: "Log your first meal", test: () => food.length >= 1 },
  { id: "food7", icon: "🥗", name: "Meal Tracker", desc: "Log food 7 days in a row", test: () => calcStreak(d => foodDayTotals()[d] != null) >= 7 },
  { id: "undergoal7", icon: "💪", name: "Discipline", desc: "7 days in a row under calorie goal", test: testUnderGoal7 },
  { id: "builder", icon: "🌯", name: "Master Builder", desc: "Log a meal with the meal builder", test: () => food.some(f => f.name.includes(" — ")) },
  { id: "goal1", icon: "🎯", name: "Goal Getter", desc: "Complete a goal", test: () => goals.some(g => g.current >= g.target) },
  { id: "goal-all", icon: "👑", name: "Overachiever", desc: "Complete 4 goals", test: () => goals.filter(g => g.current >= g.target).length >= 4 },
  { id: "habit7", icon: "🔁", name: "Habit Hero", desc: "7-day streak on a daily habit", test: () => typeof habits !== "undefined" && habits.some(h => habitBestStreak(h.id) >= 7) },
];

function maxGreenRun() {
  const dates = tradedDates().sort();
  let run = 0, best = 0;
  for (const d of dates) {
    run = dayNetUsd(d) > 0 ? run + 1 : 0;
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
  xp += weeklyHistory(days).xp; // completed weekly challenges, past and present
  if (typeof habitLog !== "undefined") for (const d in habitLog) xp += habitLog[d].length * 5; // habit check-offs
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
  confettiBurst();
}

function confettiBurst() {
  const colors = ["#4f8cff", "#34d399", "#fbbf24", "#f87171", "#7c5cff", "#fff"];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = 2 + Math.random() * 2.5 + "s";
    c.style.animationDelay = Math.random() * .8 + "s";
    c.style.borderRadius = Math.random() < .5 ? "50%" : "2px";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
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
  const loggedToday = tradesOn(t).length > 0;
  const todayCals = days[t];
  const quests = [
    { name: "Log today's trading day", done: loggedToday, xp: 10 },
    { name: "End the day green", done: loggedToday && dayNetUsd(t) > 0, xp: 15 },
    { name: "Log your meals", done: todayCals != null, xp: 5 },
    { name: "Stay under your calorie goal", done: todayCals != null && todayCals <= settings.calGoal, xp: 10 },
  ];
  if (typeof habits !== "undefined" && habits.length) {
    quests.push({ name: "Complete your daily habits", done: habits.every(h => habitDone(h.id)), xp: 10 });
  }
  const qDone = quests.filter(q => q.done).length;
  document.getElementById("game-quests").innerHTML = `
    <div class="muted" style="margin-bottom:10px">${qDone} / ${quests.length} complete</div>
    ${quests.map(q => `
      <div class="quest ${q.done ? "done" : ""}">
        <span class="qcheck">${q.done ? "✅" : "⬜"}</span> ${q.name}
        <span class="kcal">+${q.xp} XP</span>
      </div>`).join("")}`;

  // weekly challenges (arcade + overview)
  const wk = weekRange(0);
  const ws = weekStats(wk.start, wk.end, days);
  const fmtWk = d => new Date(d + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const weekLabel = `${fmtWk(wk.start)} – ${fmtWk(wk.end)}`;
  const weeklyHtml = WEEKLY_CHALLENGES.map(ch => {
    const raw = ch.value(ws);
    const v = Math.min(raw, ch.target);
    const done = raw >= ch.target;
    return `
    <div class="quest ${done ? "done" : ""}">
      <span class="qcheck">${ch.icon}</span>
      <div style="flex:1;min-width:0">
        <div>${ch.name} <span class="muted">— ${ch.desc}${ch.detail ? ` (${ch.detail(ws)})` : ""}</span></div>
        <div class="bar mini ${done ? "full" : ""}"><span style="width:${(v / ch.target) * 100}%"></span></div>
      </div>
      <span class="kcal">${done ? "✅" : `${v} / ${ch.target}`} · +${ch.xp} XP</span>
    </div>`;
  }).join("");
  const wkDone = WEEKLY_CHALLENGES.filter(ch => ch.value(ws) >= ch.target).length;
  for (const ids of [["game-weekly", "game-weekly-label"], ["dash-weekly", "dash-weekly-label"]]) {
    document.getElementById(ids[0]).innerHTML = weeklyHtml;
    document.getElementById(ids[1]).textContent = `${weekLabel} · ${wkDone} / ${WEEKLY_CHALLENGES.length} complete`;
  }

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
