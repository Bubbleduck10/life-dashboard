# 🌟 Life Dashboard

Your all-in-one tracker for money, assets, food, and goals.

**▶ Use the app: https://bubbleduck10.github.io/life-dashboard/**

**👀 Or try the demo first (sandbox, nothing saved): https://bubbleduck10.github.io/life-dashboard/?demo**

Everything runs in your browser — no accounts, no servers, and your data is
yours alone: it's stored on your own device and never leaves it. Each person
who uses the app gets their own private copy. The ☁ Sync tab can optionally
link your devices together through your own private GitHub Gist so they all
see the same numbers.

## What's inside

- **Overview** — one screen with today's net income, portfolio value and
  today's change, calories eaten vs your goal, and all goal progress bars.
- **💵 Money** — daily SOL trading log: starting/ending balance per day,
  profit in SOL and USD at the live price, monthly totals, and a swap log
  with average price.
- **📈 Assets** — add crypto or stock holdings (symbol, quantity, what you
  paid). Live prices come from CoinGecko (crypto) and Yahoo Finance (stocks),
  with 24h up/down and total gain/loss. Use the ✎ button on a row to set a
  price manually if a lookup fails.
- **🍎 Food** — type a food name and pick from the built-in calorie database
  (150+ common foods), set servings, and it totals your day against your
  calorie goal. Last-7-days history shows whether you stayed under goal.
- **🎯 Goals** — add goals with a target ("Save $5,000", "Run 100 miles"),
  add progress as you go, and watch the bars fill.

## Notes

- Data is stored in your browser's localStorage. It persists between visits,
  but is per-browser — if you switch browsers, your data won't follow.
  Clearing browser site data will erase it.
- Live prices need an internet connection; everything else works offline.
- To add foods to the calorie database, edit `foods.js` — the format is
  one line per food.
