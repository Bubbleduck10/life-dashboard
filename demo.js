/* ============ Demo mode: ?demo loads sample data in separate storage ============ */
// Real data is untouched: every storage key gets a "demo." prefix, and sync
// is disabled so nothing can reach a real account.

window.IS_DEMO = new URLSearchParams(location.search).has("demo");

if (window.IS_DEMO) {
  // banner
  const banner = document.createElement("div");
  banner.className = "demo-banner";
  banner.innerHTML = `👀 <strong>Demo mode</strong> — explore with sample data. Nothing here is real, and changes aren't saved to any account. <a href="${location.pathname}">Exit demo</a>`;
  document.body.prepend(banner);
}

// called by app.js right after its storage helper is defined,
// before any state is loaded
window.DEMO_SEED = function (store) {
  if (!window.IS_DEMO) return;
  if (store.load("life.trades", []).length) return; // already seeded

  const ds = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ds(d); };
  let seed = 42;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  // ~90 days of plausible trading, balance drifting upward
  const trades = [];
  let bal = 150;
  for (let i = 89; i >= 0; i--) {
    if (rnd() < 0.15 && i !== 0) continue; // some days off
    const start = Math.round(bal * 10) / 10;
    bal = Math.max(25, bal * (1 + (rnd() * 0.16 - 0.06))); // -6% .. +10%
    const end = Math.round(bal * 10) / 10;
    trades.push({ id: "demo" + i, date: daysAgo(i), startSol: start, endSol: end });
  }
  // notes on the best and worst day
  const byProfit = [...trades].sort((a, b) => (b.endSol - b.startSol) - (a.endSol - a.startSol));
  if (byProfit.length) {
    byProfit[0].note = "caught the breakout early and let it run 🚀";
    byProfit[byProfit.length - 1].note = "overtraded the chop — walked away, lesson learned";
  }

  const swaps = [10, 25, 38, 52, 70].map((n, i) => {
    const sol = Math.round((15 + rnd() * 45) * 10) / 10;
    const price = Math.round((90 + rnd() * 80) * 100) / 100;
    return { id: "demosw" + i, date: daysAgo(n), sol, usd: Math.round(sol * price * 100) / 100 };
  });

  const food = [];
  const meals = [
    ["Oatmeal (cooked)", 160], ["Scrambled eggs", 180], ["Banana", 105],
    ["Chicken breast (grilled)", 280], ["White rice (cooked)", 205],
    ["Caesar salad (with dressing)", 360], ["Salmon (baked)", 350],
    ["Chipotle Bowl — chicken, white rice, black beans, cheese", 630],
    ["Protein shake", 130], ["Apple", 95], ["Greek yogurt (plain, nonfat)", 130],
    ["Pizza (pepperoni)", 310], ["Burrito (chicken)", 650],
  ];
  for (let i = 6; i >= 0; i--) {
    const count = 2 + Math.floor(rnd() * 3);
    for (let m = 0; m < count; m++) {
      const pick = meals[Math.floor(rnd() * meals.length)];
      food.push({ id: `demof${i}-${m}`, date: daysAgo(i), name: pick[0], kcal: pick[1], servings: 1 });
    }
  }

  const goals = [
    { id: "demog1", title: "Save for a car", target: 8000, current: 3200, unit: "$" },
    { id: "demog2", title: "Emergency fund", target: 1500, current: 1500, unit: "$" },
    { id: "demog3", title: "Gym sessions", target: 36, current: 14, unit: "sessions" },
    { id: "demog4", title: "Withdraw profits", target: 5000, current: 1850, unit: "$" },
  ];

  const assets = [
    { id: "demoa1", kind: "crypto", symbol: "SOL", name: "Solana", cgId: "solana", qty: 50, buyPrice: 95, manualPrice: null },
    { id: "demoa2", kind: "crypto", symbol: "ETH", name: "Ethereum", cgId: "ethereum", qty: 0, buyPrice: 0, manualPrice: null },
    { id: "demoa3", kind: "stock", symbol: "AAPL", name: "AAPL", cgId: null, qty: 10, buyPrice: 220, manualPrice: null },
  ];

  store.save("life.trades", trades);
  store.save("life.swaps", swaps);
  store.save("life.food", food);
  store.save("life.goals", goals);
  store.save("life.assets", assets);
  store.save("life.settings", { calGoal: 2200 });
};
