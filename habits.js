/* ============ Daily Habits ============ */
// Recurring simple habits (Gym, Water, Clean…) checked off fresh each day.
// Definitions live in life.habits; per-day completion in life.habitLog
// ("YYYY-MM-DD" -> [habitId,…]). A per-habit streak counts consecutive days.

let habits = store.load("life.habits", []);          // {id, name, icon}
let habitLog = store.load("life.habitLog", {});      // date -> [id,…]
let habitsSeen = store.load("life.habitsSeen", null); // last date the popup auto-opened

const habDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// prune completion history older than ~120 days
(() => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 120);
  const c = habDate(cutoff);
  let changed = false;
  for (const d in habitLog) if (d < c) { delete habitLog[d]; changed = true; }
  if (changed) store.save("life.habitLog", habitLog);
})();

const HABIT_SUGGESTIONS = [
  { icon: "🏋️", name: "Gym" }, { icon: "💧", name: "Drink water" },
  { icon: "🧹", name: "Clean" }, { icon: "📖", name: "Read" },
  { icon: "🧘", name: "Meditate" }, { icon: "🚶", name: "Walk" },
  { icon: "😴", name: "Sleep 8h" }, { icon: "🥗", name: "Eat healthy" },
  { icon: "💊", name: "Vitamins" }, { icon: "☀️", name: "Sunlight" },
];

function habitDone(id, date = todayStr()) { return (habitLog[date] || []).includes(id); }

function toggleHabit(id) {
  const t = todayStr();
  const arr = habitLog[t] || (habitLog[t] = []);
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1); else arr.push(id);
  if (!arr.length) delete habitLog[t];
  store.save("life.habitLog", habitLog);
  renderHabits();
  if (window.renderGame) renderGame();
  if (window.renderDashboard) renderDashboard();
}

function habitStreak(id) {
  let n = 0; const d = new Date();
  if (habitDone(id, todayStr())) n++;
  d.setDate(d.getDate() - 1);
  while (habitDone(id, habDate(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function habitBestStreak(id) {
  const dates = Object.keys(habitLog).filter(d => habitLog[d].includes(id)).sort();
  let best = 0, run = 0, prev = null;
  for (const d of dates) {
    const consecutive = prev && (new Date(d + "T12:00") - new Date(prev + "T12:00")) === 86400000;
    run = consecutive ? run + 1 : 1; best = Math.max(best, run); prev = d;
  }
  return best;
}

function addHabit(name, icon) {
  name = (name || "").trim();
  if (!name) return;
  if (habits.some(h => h.name.toLowerCase() === name.toLowerCase())) return;
  habits.push({ id: uid(), name, icon: (icon || "✅").trim() || "✅" });
  store.save("life.habits", habits);
  renderHabits();
  if (window.renderDashboard) renderDashboard();
}

function removeHabit(id) {
  const h = habits.find(x => x.id === id);
  if (!h || !confirm(`Remove the habit "${h.name}"?`)) return;
  habits = habits.filter(x => x.id !== id);
  store.save("life.habits", habits);
  renderHabits();
  if (window.renderGame) renderGame();
  if (window.renderDashboard) renderDashboard();
}

function renderHabits() {
  const t = todayStr();
  const doneCount = habits.filter(h => habitDone(h.id)).length;
  const label = habits.length ? `${doneCount} / ${habits.length} done today` : "";

  // popup list
  const list = document.getElementById("habits-list");
  if (list) {
    list.innerHTML = habits.length ? habits.map(h => {
      const done = habitDone(h.id);
      const s = habitStreak(h.id);
      return `
      <div class="habit-item ${done ? "done" : ""}" data-id="${h.id}">
        <span class="h-icon">${esc(h.icon)}</span>
        <span class="h-name">${esc(h.name)}</span>
        ${s > 0 ? `<span class="h-streak">🔥 ${s}</span>` : ""}
        <span class="h-check">${done ? "✅" : "⬜"}</span>
        <button class="del habit-del" data-del="${h.id}" title="Remove habit">✕</button>
      </div>`;
    }).join("") : `<div class="empty">No habits yet — add one below or tap a suggestion.</div>`;
    list.querySelectorAll(".habit-item").forEach(el => el.addEventListener("click", e => {
      if (e.target.closest(".habit-del")) return;
      toggleHabit(el.dataset.id);
    }));
    list.querySelectorAll(".habit-del").forEach(b => b.addEventListener("click", () => removeHabit(b.dataset.del)));
  }

  // suggestions (only ones not already added)
  const sug = document.getElementById("habits-suggest");
  if (sug) {
    const avail = HABIT_SUGGESTIONS.filter(s => !habits.some(h => h.name.toLowerCase() === s.name.toLowerCase()));
    sug.innerHTML = avail.map(s => `<button type="button" class="habit-chip" data-icon="${s.icon}" data-name="${esc(s.name)}">${s.icon} ${esc(s.name)}</button>`).join("");
    sug.querySelectorAll(".habit-chip").forEach(b => b.addEventListener("click", () => addHabit(b.dataset.name, b.dataset.icon)));
  }

  const dateEl = document.getElementById("habits-date");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  // overview panel
  const dash = document.getElementById("dash-habits");
  if (dash) {
    dash.innerHTML = habits.length ? habits.map(h => {
      const done = habitDone(h.id);
      const s = habitStreak(h.id);
      return `
      <div class="quest ${done ? "done" : ""}" data-id="${h.id}" style="cursor:pointer">
        <span class="qcheck">${done ? "✅" : "⬜"}</span> ${esc(h.icon)} ${esc(h.name)}
        <span class="kcal">${s > 0 ? "🔥 " + s : ""}</span>
      </div>`;
    }).join("") : `<div class="empty">No daily habits yet — tap Open to add Gym, Water, Clean…</div>`;
    dash.querySelectorAll(".quest[data-id]").forEach(el => el.addEventListener("click", () => toggleHabit(el.dataset.id)));
  }
  const dashLabel = document.getElementById("dash-habits-label");
  if (dashLabel) dashLabel.textContent = label;
}

function openHabits() {
  document.getElementById("habits-modal").style.display = "flex";
  habitsSeen = todayStr(); store.save("life.habitsSeen", habitsSeen);
  renderHabits();
}
function closeHabits() { document.getElementById("habits-modal").style.display = "none"; }

const allHabitsDone = () => habits.length && habits.every(h => habitDone(h.id));
function maybeAutoOpenHabits() {
  if (window.IS_DEMO) return;
  if (!habits.length || habitsSeen === todayStr() || allHabitsDone()) return;
  openHabits();
}

document.getElementById("dash-habits-open").addEventListener("click", openHabits);
document.getElementById("habits-close").addEventListener("click", closeHabits);
document.getElementById("habits-modal").addEventListener("click", e => { if (e.target.id === "habits-modal") closeHabits(); });
document.getElementById("habit-form").addEventListener("submit", e => {
  e.preventDefault();
  addHabit(document.getElementById("habit-name").value, document.getElementById("habit-icon").value);
  document.getElementById("habit-name").value = "";
  document.getElementById("habit-icon").value = "✅";
  document.getElementById("habit-name").focus();
});

renderHabits();
maybeAutoOpenHabits();
