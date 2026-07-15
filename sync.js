/* ============ Cloud sync via private GitHub Gist ============ */
// Data lives in a private gist named life-dashboard-data.json in the user's
// GitHub account. Strategy: pull on load, debounced push on every change,
// last-write-wins by timestamp. Token (classic, gist scope) stays in localStorage.

const SYNC_KEYS = ["life.trades", "life.swaps", "life.assets", "life.food", "life.goals", "life.settings", "life.restaurants", "life.todos", "life.share", "life.habits", "life.habitLog"];
const GIST_FILE = "life-dashboard-data.json";
const GH_API = "https://api.github.com";

let sync = store.load("life.sync", { token: null, gistId: null, lastSync: 0 });
let pushTimer = null;
let syncBusy = false;

function syncHeaders() {
  return {
    "Authorization": "Bearer " + sync.token,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

function setSyncStatus(msg, cls) {
  const el = document.getElementById("sync-status");
  if (el) { el.textContent = msg; el.className = "statusmsg " + (cls || ""); }
  const dot = document.getElementById("sync-indicator");
  if (dot) dot.textContent = sync.token ? (cls === "down" ? "☁ sync error" : "☁ synced") : "";
}

function snapshotLocal() {
  const data = {};
  for (const k of SYNC_KEYS) data[k] = store.load(k, null);
  return { updatedAt: Date.now(), data };
}

function applyRemote(envelope) {
  for (const k of SYNC_KEYS) {
    if (envelope.data && k in envelope.data && envelope.data[k] !== null) {
      store.save(k, envelope.data[k]);
    }
  }
  // reload in-memory state from storage and re-render everything
  trades = store.load("life.trades", []);
  swaps = store.load("life.swaps", []);
  assets = store.load("life.assets", []);
  food = store.load("life.food", []);
  goals = store.load("life.goals", []);
  settings = store.load("life.settings", { calGoal: 2000 });
  restState = store.load("life.restaurants", { enabled: ["Chipotle", "Subway"], custom: {} });
  todos = store.load("life.todos", []);
  habits = store.load("life.habits", []);
  habitLog = store.load("life.habitLog", {});
  renderMoney(); renderAssets(); renderFood(); renderGoals(); renderTodos(); renderHabits(); renderDashboard();
  renderRestaurantSelect();
  ensureSolHistory(); // imported/synced trades may need historical prices
}

async function gistPull() {
  if (!sync.token || !sync.gistId) return null;
  const res = await fetch(`${GH_API}/gists/${sync.gistId}`, { headers: syncHeaders() });
  if (!res.ok) throw new Error("gist fetch " + res.status);
  const gist = await res.json();
  const file = gist.files && gist.files[GIST_FILE];
  if (!file) return null;
  let content = file.content;
  if (file.truncated) content = await (await fetch(file.raw_url)).text();
  try { return JSON.parse(content); } catch { return null; }
}

async function gistPush() {
  if (window.IS_DEMO) return;
  if (!sync.token || !sync.gistId || syncBusy) return;
  syncBusy = true;
  try {
    const envelope = snapshotLocal();
    const res = await fetch(`${GH_API}/gists/${sync.gistId}`, {
      method: "PATCH",
      headers: syncHeaders(),
      body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(envelope) } } })
    });
    if (!res.ok) throw new Error("push " + res.status);
    sync.lastSync = envelope.updatedAt;
    store.save("life.sync", sync);
    setSyncStatus("Synced " + new Date().toLocaleTimeString(), "up");
  } catch (e) {
    setSyncStatus("Sync push failed (" + e.message + ") — will retry on next change.", "down");
  }
  syncBusy = false;
}

function queuePush() {
  if (!sync.token || !sync.gistId) return;
  clearTimeout(pushTimer);
  setSyncStatus("Saving to cloud…");
  pushTimer = setTimeout(gistPush, 1500);
}

// called by store.save in app.js whenever synced data changes
window.onDataChanged = key => { if (SYNC_KEYS.includes(key)) queuePush(); };

async function findOrCreateGist() {
  // look for an existing data gist first (covers connecting a second device)
  const res = await fetch(`${GH_API}/gists?per_page=100`, { headers: syncHeaders() });
  if (!res.ok) throw new Error("gist list " + res.status);
  const gists = await res.json();
  const existing = gists.find(g => g.files && g.files[GIST_FILE]);
  if (existing) return { id: existing.id, created: false };

  const createRes = await fetch(`${GH_API}/gists`, {
    method: "POST",
    headers: syncHeaders(),
    body: JSON.stringify({
      description: "Life Dashboard data (auto-synced)",
      public: false,
      files: { [GIST_FILE]: { content: JSON.stringify(snapshotLocal()) } }
    })
  });
  if (!createRes.ok) throw new Error("gist create " + createRes.status);
  return { id: (await createRes.json()).id, created: true };
}

async function connectSync() {
  const token = document.getElementById("sync-token").value.trim();
  if (!token) return;
  setSyncStatus("Connecting to GitHub…");
  sync.token = token;
  try {
    const who = await fetch(`${GH_API}/user`, { headers: syncHeaders() });
    if (!who.ok) throw new Error(who.status === 401 ? "token rejected" : "user " + who.status);
    const user = await who.json();

    const found = await findOrCreateGist();
    sync.gistId = found.id;
    store.save("life.sync", sync);
    document.getElementById("sync-token").value = "";

    if (found.created) {
      sync.lastSync = Date.now();
      store.save("life.sync", sync);
      setSyncStatus(`Connected as ${user.login} — created your cloud save.`, "up");
    } else {
      // existing cloud data: newest side wins
      const remote = await gistPull();
      const localHasData = SYNC_KEYS.some(k => { const v = store.load(k, null); return Array.isArray(v) ? v.length : false; });
      if (remote && (!localHasData || remote.updatedAt > sync.lastSync)) {
        applyRemote(remote);
        sync.lastSync = remote.updatedAt;
        store.save("life.sync", sync);
        setSyncStatus(`Connected as ${user.login} — loaded your cloud data.`, "up");
      } else {
        await gistPush();
        setSyncStatus(`Connected as ${user.login} — uploaded this device's data.`, "up");
      }
    }
    renderSyncPanel();
  } catch (e) {
    sync.token = null; sync.gistId = null;
    store.save("life.sync", sync);
    setSyncStatus("Couldn't connect: " + e.message + ". Check the token has the \"gist\" scope.", "down");
  }
}

async function pullLatest(silent) {
  if (window.IS_DEMO) return;
  if (!sync.token || !sync.gistId) return;
  try {
    const remote = await gistPull();
    if (remote && remote.updatedAt > sync.lastSync) {
      applyRemote(remote);
      sync.lastSync = remote.updatedAt;
      store.save("life.sync", sync);
      setSyncStatus("Pulled newer data from cloud " + new Date().toLocaleTimeString(), "up");
    } else if (!silent) {
      setSyncStatus("Already up to date.", "up");
    }
  } catch (e) {
    if (!silent) setSyncStatus("Pull failed: " + e.message, "down");
  }
}

function disconnectSync() {
  if (!confirm("Disconnect cloud sync on this device? Your data stays here and in the cloud — this just stops syncing.")) return;
  sync = { token: null, gistId: null, lastSync: 0 };
  store.save("life.sync", sync);
  renderSyncPanel();
  setSyncStatus("Disconnected.");
}

/* ----- Export / Import backup file ----- */
function exportBackup() {
  const blob = new Blob([JSON.stringify(snapshotLocal(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `life-dashboard-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const envelope = JSON.parse(reader.result);
      if (!envelope.data) throw new Error("not a Life Dashboard backup");
      if (!confirm("Replace this device's data with the backup file? Current data will be overwritten.")) return;
      applyRemote(envelope);
      queuePush();
      setSyncStatus("Backup imported.", "up");
    } catch (e) {
      setSyncStatus("Import failed: " + e.message, "down");
    }
  };
  reader.readAsText(file);
}

function renderSyncPanel() {
  const connected = !!(sync.token && sync.gistId);
  document.getElementById("sync-connected").style.display = connected ? "" : "none";
  document.getElementById("sync-setup").style.display = connected ? "none" : "";
  setSyncStatus(connected ? "Connected — syncing automatically." : "Not connected.");
}

document.getElementById("sync-connect-btn").addEventListener("click", connectSync);
document.getElementById("sync-token").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); connectSync(); } });
document.getElementById("sync-pull-btn").addEventListener("click", () => pullLatest(false));
document.getElementById("sync-disconnect-btn").addEventListener("click", disconnectSync);
document.getElementById("export-btn").addEventListener("click", exportBackup);
document.getElementById("import-file").addEventListener("change", e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ""; });

if (window.IS_DEMO) {
  document.getElementById("sync-setup").innerHTML =
    `<p class="muted">☁ Cloud sync is disabled in demo mode. In the real app, your data syncs across your devices through your own private GitHub Gist — no account on any third-party service.</p>`;
  document.getElementById("sync-connected").style.display = "none";
  setSyncStatus("Demo mode — sync off.");
} else {
  renderSyncPanel();
  if (sync.token && sync.gistId) pullLatest(true);
  // check for newer cloud data periodically (catches edits made on another device)
  setInterval(() => pullLatest(true), 5 * 60 * 1000);
}
