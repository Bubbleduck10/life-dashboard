/* ============ Demo mode: ?demo runs the app on a blank, isolated slate ============ */
// Real data is untouched: every storage key gets a "demo." prefix (see app.js),
// and sync is disabled so nothing can reach a real account. The demo starts
// empty so visitors experience the app from scratch.

window.IS_DEMO = new URLSearchParams(location.search).has("demo");

if (window.IS_DEMO) {
  const banner = document.createElement("div");
  banner.className = "demo-banner";
  banner.innerHTML = `👀 <strong>Demo mode</strong> — try the app out. Nothing you enter is saved to any account. <a href="${location.pathname}">Exit demo</a>`;
  document.body.prepend(banner);

  // wipe sample data left over from the earlier pre-filled demo
  // (its entries had ids starting with "demo"; real visitor entries don't)
  try {
    const t = JSON.parse(localStorage.getItem("demo.life.trades")) || [];
    if (t.some(x => String(x.id).startsWith("demo"))) {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("demo.")) localStorage.removeItem(k);
      }
    }
  } catch {}
}
