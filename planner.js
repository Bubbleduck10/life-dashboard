/* ============ Hourly planner (Overview) ============ */
// Plan each hour of the day; entries are per-date so every day starts fresh.
// Current hour is highlighted and scrolled into view. Syncs across devices.

let planner = store.load("life.planner", {}); // { "YYYY-MM-DD": { "9": "Gym", ... } }
let plannerRenderedDate = null;

// keep ~21 days of history, drop older
(() => {
  const cut = new Date(); cut.setDate(cut.getDate() - 21);
  const c = `${cut.getFullYear()}-${String(cut.getMonth() + 1).padStart(2, "0")}-${String(cut.getDate()).padStart(2, "0")}`;
  let changed = false;
  for (const d in planner) if (d < c) { delete planner[d]; changed = true; }
  if (changed) store.save("life.planner", planner);
})();

const hourLabel = h => { const ap = h < 12 ? "AM" : "PM"; const hr = h % 12 === 0 ? 12 : h % 12; return `${hr} ${ap}`; };

function renderPlanner() {
  const t = todayStr();
  plannerRenderedDate = t;
  const day = planner[t] || {};
  const nowH = new Date().getHours();
  document.getElementById("planner-date").textContent =
    new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  const box = document.getElementById("planner-rows");
  box.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const row = document.createElement("div");
    row.className = "planner-row" + (h === nowH ? " now" : "");
    row.dataset.h = h;
    row.innerHTML = `<span class="planner-time">${hourLabel(h)}</span>`;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.placeholder = "…";
    inp.value = day[h] || "";
    inp.addEventListener("change", () => {
      const d = planner[t] || (planner[t] = {});
      const v = inp.value.trim();
      if (v) d[h] = v; else delete d[h];
      if (!Object.keys(d).length) delete planner[t];
      store.save("life.planner", planner);
    });
    row.appendChild(inp);
    box.appendChild(row);
  }
  // scroll the current hour into the middle of the panel
  const nowRow = box.querySelector(".planner-row.now");
  if (nowRow) box.scrollTop = nowRow.offsetTop - box.clientHeight / 2 + nowRow.clientHeight;
}

// refresh the "now" highlight each minute (and roll over at midnight) without losing focus
function plannerTick() {
  if (todayStr() !== plannerRenderedDate) { renderPlanner(); return; }
  const nowH = new Date().getHours();
  document.querySelectorAll("#planner-rows .planner-row").forEach(r => {
    r.classList.toggle("now", +r.dataset.h === nowH);
  });
}

document.getElementById("planner-clear").addEventListener("click", () => {
  if (!confirm("Clear today's hourly plan?")) return;
  delete planner[todayStr()];
  store.save("life.planner", planner);
  renderPlanner();
});

renderPlanner();
setInterval(plannerTick, 60 * 1000);
