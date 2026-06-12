/* ============ Accounts: Firebase Auth + Firestore cloud save ============ */
// Local-first: the app always works from localStorage. When signed in, data
// also saves to the user's own slot in Firestore (users/{uid}, protected by
// rules so only they can read it) and follows them across devices.
// The whole feature stays dormant until firebase-config.js has a config.

let fbAuth = null, fbDb = null, fbUser = null;
let acct = store.load("life.account", { lastSync: 0 });
let acctPushTimer = null;

function acctStatus(msg, cls) {
  const el = document.getElementById("account-msg");
  if (el) { el.textContent = msg; el.className = "statusmsg " + (cls || ""); }
}

function acctShow(state) { // "not-configured" | "signed-out" | "signed-in"
  for (const s of ["not-configured", "signed-out", "signed-in"]) {
    document.getElementById("account-" + s).style.display = s === state ? "" : "none";
  }
}

function acctSnapshot() {
  const data = {};
  for (const k of SYNC_KEYS) data[k] = store.load(k, null);
  return { updatedAt: Date.now(), data };
}

async function acctPull(silent) {
  if (!fbUser) return;
  try {
    const doc = await fbDb.collection("users").doc(fbUser.uid).get();
    if (doc.exists) {
      const d = doc.data();
      const envelope = { updatedAt: d.updatedAt || 0, data: JSON.parse(d.payload || "{}") };
      const localHasData = SYNC_KEYS.some(k => { const v = store.load(k, null); return Array.isArray(v) ? v.length : false; });
      if (!localHasData || envelope.updatedAt > acct.lastSync) {
        applyRemote(envelope); // from sync.js — also re-renders everything
        acct.lastSync = envelope.updatedAt;
        store.save("life.account", acct);
        if (!silent) acctStatus("Loaded your data from your account.", "up");
        return;
      }
    }
    // nothing in the cloud yet, or local is newer — upload
    await acctPush();
  } catch (e) {
    if (!silent) acctStatus("Couldn't reach your account: " + e.message, "down");
  }
}

async function acctPush() {
  if (!fbUser) return;
  try {
    const envelope = acctSnapshot();
    await fbDb.collection("users").doc(fbUser.uid).set({
      updatedAt: envelope.updatedAt,
      payload: JSON.stringify(envelope.data),
      email: fbUser.email || null,
    });
    acct.lastSync = envelope.updatedAt;
    store.save("life.account", acct);
    const el = document.getElementById("account-sync-status");
    if (el) el.textContent = "☁ Saved to your account " + new Date().toLocaleTimeString();
  } catch (e) {
    const el = document.getElementById("account-sync-status");
    if (el) el.textContent = "Cloud save failed (" + e.message + ") — will retry on next change.";
  }
}

function acctQueuePush() {
  if (!fbUser) return;
  clearTimeout(acctPushTimer);
  acctPushTimer = setTimeout(acctPush, 1500);
}

// receive data-change events without disturbing the gist sync hook
{
  const prevHook = window.onDataChanged;
  window.onDataChanged = key => {
    if (prevHook) prevHook(key);
    if (SYNC_KEYS.includes(key)) acctQueuePush();
  };
}

function friendlyAuthError(e) {
  const code = e && e.code || "";
  if (code.includes("invalid-email")) return "That email doesn't look right.";
  if (code.includes("email-already-in-use")) return "That email already has an account — try Log in.";
  if (code.includes("weak-password")) return "Password needs at least 6 characters.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Wrong email or password.";
  if (code.includes("too-many-requests")) return "Too many tries — wait a minute and try again.";
  if (code.includes("popup-closed")) return "Google sign-in was closed before finishing.";
  return e.message || "Something went wrong.";
}

function initAccount() {
  const panelState = () => {
    if (window.IS_DEMO) {
      document.getElementById("account-not-configured").innerHTML =
        `<p class="muted">👤 Accounts are disabled in demo mode.</p>`;
      acctShow("not-configured");
      return false;
    }
    if (!window.FIREBASE_CONFIG) {
      acctShow("not-configured");
      return false;
    }
    return true;
  };
  if (!panelState()) return;

  // load the Firebase SDK only when accounts are actually switched on
  const scripts = [
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
  ];
  let loaded = 0;
  for (const src of scripts) {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { if (++loaded === scripts.length) startFirebase(); };
    s.onerror = () => acctStatus("Couldn't load the sign-in service — check your connection.", "down");
    document.head.appendChild(s);
  }
}

function startFirebase() {
  firebase.initializeApp(window.FIREBASE_CONFIG);
  fbAuth = firebase.auth();
  fbDb = firebase.firestore();

  fbAuth.onAuthStateChanged(user => {
    fbUser = user;
    if (user) {
      document.getElementById("account-email").textContent = user.email || "(Google account)";
      acctShow("signed-in");
      acctPull(true);
    } else {
      acctShow("signed-out");
    }
  });

  const email = () => document.getElementById("account-em").value.trim();
  const pass = () => document.getElementById("account-pw").value;

  document.getElementById("account-login").addEventListener("click", async () => {
    if (!email() || !pass()) { acctStatus("Enter your email and password first."); return; }
    acctStatus("Logging in…");
    try { await fbAuth.signInWithEmailAndPassword(email(), pass()); acctStatus(""); }
    catch (e) { acctStatus(friendlyAuthError(e), "down"); }
  });

  document.getElementById("account-signup").addEventListener("click", async () => {
    if (!email() || !pass()) { acctStatus("Enter an email and a password (6+ characters)."); return; }
    acctStatus("Creating your account…");
    try { await fbAuth.createUserWithEmailAndPassword(email(), pass()); acctStatus(""); }
    catch (e) { acctStatus(friendlyAuthError(e), "down"); }
  });

  document.getElementById("account-google").addEventListener("click", async () => {
    acctStatus("Opening Google sign-in…");
    try { await fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); acctStatus(""); }
    catch (e) { acctStatus(friendlyAuthError(e), "down"); }
  });

  document.getElementById("account-signout").addEventListener("click", async () => {
    await acctPush(); // last save before leaving
    await fbAuth.signOut();
    acctStatus("Signed out. Your data stays on this device.");
  });

  document.getElementById("account-pw").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("account-login").click(); }
  });

  // catch changes made on another device while the app is open
  setInterval(() => { if (fbUser) acctPull(true); }, 5 * 60 * 1000);
}

initAccount();
