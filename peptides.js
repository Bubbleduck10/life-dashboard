/* ============ Peptide Dashboard ============ */
// Personal reminder tool: you enter your own protocol (dose, units, days,
// time[s]); it shows today's schedule, tracks what you've taken, your next
// dose, and can fire browser reminders while the app is open. Not medical
// advice — follow the protocol from your provider.

let peptides = store.load("life.peptides", []);   // {id, name, dose, unit, freq, times[], site, active}
let peptideLog = store.load("life.peptideLog", {}); // date -> { "id|HH:MM": true }
let pepEditId = null;
let pepFormTimes = ["08:00"];
let pepFormDays = [1, 2, 3, 4, 5];
const pepNotified = new Set();

const pepDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const nowHHMM = () => { const n = new Date(); return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"); };

// prune completion history older than ~120 days
(() => {
  const c = new Date(); c.setDate(c.getDate() - 120);
  const cutoff = pepDate(c); let changed = false;
  for (const d in peptideLog) if (d < cutoff) { delete peptideLog[d]; changed = true; }
  if (changed) store.save("life.peptideLog", peptideLog);
})();

const WD = [["S", 0], ["M", 1], ["T", 2], ["W", 3], ["T", 4], ["F", 5], ["S", 6]]; // display order handled below
const WD_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WD_LABEL = { 0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S" };

function pepIsDue(p, dateStr) {
  const d = new Date(dateStr + "T12:00");
  const f = p.freq;
  if (!f || f.type === "daily") return true;
  if (f.type === "days") return (f.days || []).includes(d.getDay());
  if (f.type === "everyN") {
    const start = new Date((f.startDate || dateStr) + "T12:00");
    const diff = Math.round((d - start) / 86400000);
    return diff >= 0 && diff % (f.n || 1) === 0;
  }
  return true;
}

const pepKey = (id, time) => id + "|" + time;
const pepTaken = (id, time, date = todayStr()) => (peptideLog[date] || {})[pepKey(id, time)] === true;

function markDose(id, time) {
  const t = todayStr();
  const day = peptideLog[t] || (peptideLog[t] = {});
  const k = pepKey(id, time);
  if (day[k]) delete day[k]; else day[k] = true;
  if (!Object.keys(day).length) delete peptideLog[t];
  store.save("life.peptideLog", peptideLog);
  renderPeptides();
}

function todaysDoses() {
  const t = todayStr();
  const list = [];
  for (const p of peptides) {
    if (!p.active) continue;
    if (!pepIsDue(p, t)) continue;
    for (const time of (p.times || [])) list.push({ p, time, taken: pepTaken(p.id, time, t) });
  }
  return list.sort((a, b) => a.time.localeCompare(b.time));
}

function nextDose() {
  const now = nowHHMM();
  const today = todaysDoses().filter(d => !d.taken && d.time >= now).sort((a, b) => a.time.localeCompare(b.time));
  if (today.length) return { ...today[0], when: "today" };
  // scan the next 14 days for the first due dose
  for (let i = 1; i <= 14; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const ds = pepDate(d);
    const due = peptides.filter(p => p.active && pepIsDue(p, ds) && (p.times || []).length)
      .map(p => ({ p, time: [...p.times].sort()[0], ds })).sort((a, b) => a.time.localeCompare(b.time));
    if (due.length) return { ...due[0], when: i === 1 ? "tomorrow" : new Date(ds + "T12:00").toLocaleDateString(undefined, { weekday: "short" }) };
  }
  return null;
}

/* ----- reminders (while the app is open) ----- */
function pepReminderTick() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = nowHHMM();
  for (const d of todaysDoses()) {
    if (d.taken) continue;
    const key = todayStr() + "|" + d.p.id + "|" + d.time;
    if (d.time <= now && d.time >= "00:00" && !pepNotified.has(key)) {
      // only notify within ~90 min of the scheduled time so opening later isn't spammy
      const [h, m] = d.time.split(":").map(Number);
      const mins = (new Date().getHours() * 60 + new Date().getMinutes()) - (h * 60 + m);
      if (mins >= 0 && mins <= 90) {
        pepNotified.add(key);
        try {
          new Notification("💉 " + d.p.name, { body: `Take ${d.p.dose || ""}${d.p.unit || ""}${d.p.site ? " · " + d.p.site : ""} (scheduled ${d.time})`, tag: key });
        } catch {}
      }
    }
  }
}

async function enablePepReminders() {
  if (!("Notification" in window)) { document.getElementById("pep-remind-status").textContent = "This browser doesn't support notifications."; return; }
  const perm = await Notification.requestPermission();
  renderPepReminderCard();
  if (perm === "granted") pepReminderTick();
}

function renderPepReminderCard() {
  const btn = document.getElementById("pep-remind-btn");
  const status = document.getElementById("pep-remind-status");
  const perm = ("Notification" in window) ? Notification.permission : "unsupported";
  if (perm === "granted") { btn.style.display = "none"; status.textContent = "On — alerts fire while the app is open."; }
  else if (perm === "denied") { btn.style.display = "none"; status.textContent = "Blocked in browser settings. Allow notifications for this site to use reminders."; }
  else if (perm === "unsupported") { btn.style.display = "none"; status.textContent = "Notifications aren't supported here."; }
  else { btn.style.display = ""; status.textContent = "Get a nudge at each dose time (while the app is open)."; }
}

/* ----- form ----- */
function renderPepFormDynamic() {
  const freq = document.getElementById("pep-freq").value;
  document.getElementById("pep-days-wrap").style.display = freq === "days" ? "" : "none";
  document.getElementById("pep-everyn-wrap").style.display = freq === "everyN" ? "" : "none";
  document.getElementById("pep-days").innerHTML = WD_ORDER.map(d =>
    `<button type="button" class="pep-day ${pepFormDays.includes(d) ? "on" : ""}" data-d="${d}">${WD_LABEL[d]}</button>`).join("");
  document.querySelectorAll("#pep-days .pep-day").forEach(b => b.addEventListener("click", () => {
    const d = +b.dataset.d;
    if (pepFormDays.includes(d)) pepFormDays = pepFormDays.filter(x => x !== d); else pepFormDays.push(d);
    renderPepFormDynamic();
  }));
  document.getElementById("pep-times").innerHTML = pepFormTimes.length
    ? pepFormTimes.sort().map(t => `<span class="pep-time-chip">${t}<button type="button" data-t="${t}">✕</button></span>`).join("")
    : `<span class="muted" style="font-size:12px">Add at least one time →</span>`;
  document.querySelectorAll("#pep-times [data-t]").forEach(b => b.addEventListener("click", () => {
    pepFormTimes = pepFormTimes.filter(t => t !== b.dataset.t); renderPepFormDynamic();
  }));
}

function resetPepForm() {
  pepEditId = null; pepFormTimes = ["08:00"]; pepFormDays = [1, 2, 3, 4, 5];
  document.getElementById("pep-name").value = "";
  document.getElementById("pep-dose").value = "";
  document.getElementById("pep-unit").value = "mcg";
  document.getElementById("pep-freq").value = "daily";
  document.getElementById("pep-everyn").value = "2";
  document.getElementById("pep-start").value = todayStr();
  document.getElementById("pep-site").value = "";
  document.getElementById("pep-submit").textContent = "Add peptide";
  renderPepFormDynamic();
}

function loadPepIntoForm(p) {
  pepEditId = p.id;
  pepFormTimes = [...(p.times || ["08:00"])];
  pepFormDays = p.freq && p.freq.days ? [...p.freq.days] : [1, 2, 3, 4, 5];
  document.getElementById("pep-name").value = p.name;
  document.getElementById("pep-dose").value = p.dose ?? "";
  document.getElementById("pep-unit").value = p.unit || "mcg";
  document.getElementById("pep-freq").value = p.freq ? p.freq.type : "daily";
  document.getElementById("pep-everyn").value = p.freq && p.freq.n ? p.freq.n : 2;
  document.getElementById("pep-start").value = p.freq && p.freq.startDate ? p.freq.startDate : todayStr();
  document.getElementById("pep-site").value = p.site || "";
  document.getElementById("pep-submit").textContent = "Save changes";
  renderPepFormDynamic();
  document.getElementById("pep-name").scrollIntoView({ block: "center" });
}

/* ----- render ----- */
function fmtFreq(f) {
  if (!f || f.type === "daily") return "every day";
  if (f.type === "days") return (f.days || []).length === 7 ? "every day" : WD_ORDER.filter(d => (f.days || []).includes(d)).map(d => WD_LABEL[d]).join(" ");
  if (f.type === "everyN") return `every ${f.n} day${f.n === 1 ? "" : "s"}`;
  return "";
}

function renderPeptides() {
  const doses = todaysDoses();
  const takenN = doses.filter(d => d.taken).length;

  // cards
  const countEl = document.getElementById("pep-today-count");
  countEl.textContent = doses.length ? `${takenN} / ${doses.length}` : "—";
  document.getElementById("pep-today-sub").textContent = doses.length
    ? (takenN === doses.length ? "all doses taken 🎉" : "doses taken today")
    : (peptides.length ? "nothing scheduled today" : "no peptides added yet");

  const nd = nextDose();
  document.getElementById("pep-next").textContent = nd ? nd.time : "—";
  document.getElementById("pep-next-sub").textContent = nd ? `${nd.p.name} · ${nd.when}` : "add a peptide below";

  // today's schedule
  const now = nowHHMM();
  const sched = document.getElementById("pep-schedule");
  sched.innerHTML = doses.length ? doses.map(d => {
    const state = d.taken ? "taken" : d.time <= now ? "due" : "upcoming";
    return `
    <div class="pep-dose ${state}">
      <span class="pep-dose-time">${d.time}</span>
      <div class="pep-dose-main">
        <div class="pep-dose-name">${esc(d.p.name)} <span class="muted">${d.p.dose ? esc(String(d.p.dose)) + esc(d.p.unit || "") : ""}</span></div>
        ${d.p.site ? `<div class="muted" style="font-size:12px">${esc(d.p.site)}</div>` : ""}
      </div>
      ${state === "due" ? '<span class="pep-badge due">due now</span>' : ""}
      <button class="btn small ${d.taken ? "ghost" : ""}" data-take="${d.p.id}" data-time="${d.time}">${d.taken ? "✓ taken" : "Mark taken"}</button>
    </div>`;
  }).join("")
    : `<div class="empty">${peptides.length ? "Nothing scheduled for today." : "No peptides yet — add one below."}</div>`;
  sched.querySelectorAll("[data-take]").forEach(b => b.addEventListener("click", () => markDose(b.dataset.take, b.dataset.time)));

  // protocol list
  const list = document.getElementById("pep-list");
  list.innerHTML = peptides.length ? peptides.map(p => `
    <div class="pep-item ${p.active ? "" : "paused"}">
      <div style="flex:1">
        <div style="font-weight:700">${esc(p.name)} ${p.active ? "" : '<span class="muted" style="font-size:12px">(paused)</span>'}</div>
        <div class="muted" style="font-size:13px">${p.dose ? esc(String(p.dose)) + esc(p.unit || "") + " · " : ""}${fmtFreq(p.freq)} · ${(p.times || []).sort().join(", ")}${p.site ? " · " + esc(p.site) : ""}</div>
      </div>
      <button class="btn small ghost" data-toggle="${p.id}">${p.active ? "Pause" : "Resume"}</button>
      <button class="btn small ghost" data-edit="${p.id}">Edit</button>
      <button class="del" data-del="${p.id}" title="Delete">✕</button>
    </div>`).join("")
    : `<div class="empty">No peptides added yet.</div>`;
  list.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => {
    const p = peptides.find(x => x.id === b.dataset.toggle); p.active = !p.active;
    store.save("life.peptides", peptides); renderPeptides();
  }));
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => loadPepIntoForm(peptides.find(x => x.id === b.dataset.edit))));
  list.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    const p = peptides.find(x => x.id === b.dataset.del);
    if (!confirm(`Delete "${p.name}"?`)) return;
    peptides = peptides.filter(x => x.id !== p.id);
    store.save("life.peptides", peptides);
    if (pepEditId === p.id) resetPepForm();
    renderPeptides();
  }));

  // overview panel (only when peptides exist)
  const ov = document.getElementById("dash-pep-panel");
  if (ov) {
    ov.style.display = peptides.length ? "" : "none";
    const dash = document.getElementById("dash-pep");
    if (dash && peptides.length) {
      dash.innerHTML = doses.length ? doses.map(d => `
        <div class="quest ${d.taken ? "done" : ""}" data-take="${d.p.id}" data-time="${d.time}" style="cursor:pointer">
          <span class="qcheck">${d.taken ? "✅" : "⬜"}</span> ${d.time} — ${esc(d.p.name)} <span class="muted">${d.p.dose ? esc(String(d.p.dose)) + esc(d.p.unit || "") : ""}</span>
        </div>`).join("") : `<div class="empty">Nothing scheduled today.</div>`;
      dash.querySelectorAll("[data-take]").forEach(b => b.addEventListener("click", () => markDose(b.dataset.take, b.dataset.time)));
      document.getElementById("dash-pep-label").textContent = doses.length ? `${takenN} / ${doses.length} taken` : "";
    }
  }

  renderPepReminderCard();
}

/* ----- wiring ----- */
document.getElementById("pep-freq").addEventListener("change", renderPepFormDynamic);
document.getElementById("pep-add-time").addEventListener("click", () => {
  const v = document.getElementById("pep-time").value;
  if (v && !pepFormTimes.includes(v)) { pepFormTimes.push(v); renderPepFormDynamic(); }
});
document.getElementById("pep-remind-btn").addEventListener("click", enablePepReminders);

document.getElementById("pep-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("pep-name").value.trim();
  if (!name) return;
  if (!pepFormTimes.length) { alert("Add at least one time of day."); return; }
  const type = document.getElementById("pep-freq").value;
  const freq = { type };
  if (type === "days") { if (!pepFormDays.length) { alert("Pick at least one day."); return; } freq.days = [...pepFormDays]; }
  if (type === "everyN") { freq.n = Math.max(1, parseInt(document.getElementById("pep-everyn").value) || 1); freq.startDate = document.getElementById("pep-start").value || todayStr(); }
  const data = {
    name,
    dose: parseFloat(document.getElementById("pep-dose").value) || null,
    unit: document.getElementById("pep-unit").value,
    freq,
    times: [...pepFormTimes].sort(),
    site: document.getElementById("pep-site").value.trim(),
    active: true,
  };
  if (pepEditId) {
    const p = peptides.find(x => x.id === pepEditId);
    Object.assign(p, data);
  } else {
    peptides.push({ id: uid(), ...data });
  }
  store.save("life.peptides", peptides);
  resetPepForm();
  renderPeptides();
});

resetPepForm();
renderPeptides();
setInterval(() => { renderPeptides(); pepReminderTick(); }, 60 * 1000);
