/* ============ Dash: built-in help chat (rule-based, runs locally) ============ */

const CHAT_INTENTS = [
  {
    keywords: ["log trade", "log a trade", "trading day", "log day", "log my day", "starting sol", "ending sol", "add a day", "log profit", "daily profit"],
    answer: "Go to <strong>💵 Money → Log a trading day</strong>: pick the date, enter your <strong>starting SOL</strong> and <strong>ending SOL</strong>, and hit Log day. Profit = ending − starting, and the USD value is calculated automatically. Logging the same date again overwrites that day."
  },
  {
    keywords: ["currency", "usdc", "different coin", "change coin", "eth instead", "btc instead", "other coin", "trade eth", "trade btc"],
    answer: "The <strong>Currency</strong> selector in the Log-a-trading-day form lets you track <strong>SOL, USDC, ETH, or BTC</strong>. You can log <strong>several currencies on the same day</strong> — just log the date again with a different coin and both entries stack (re-logging the same date + coin overwrites it). USDC counts as $1 flat; ETH and BTC use live and historical day-of prices like SOL. The day's card, calendar, and totals combine them into one USD figure."
  },
  {
    keywords: ["note", "notes", "journal", "write on a day"],
    answer: "Every day in the Money table has a <strong>📝 button</strong> next to the ✕. Click it to add a note (like a mini trading journal) — it shows under that day, and the icon highlights on days that have one. Click again to edit, clear the text to remove."
  },
  {
    keywords: ["edit", "update ending", "update starting", "change ending", "change starting", "day not over", "not complete", "fix a day", "wrong number", "pencil"],
    answer: "Click the <strong>✎ pencil</strong> on any day in the Money table to edit its <strong>starting and ending balance</strong> — handy when your day isn't finished and the balance is still moving. Profit and USD recalculate instantly. Use 📝 to edit that day's note."
  },
  {
    keywords: ["swap", "swaps", "swapped", "stables", "sold sol", "bought sol"],
    answer: "The <strong>SOL swaps</strong> panel on the Money tab logs SOL you bought or sold: date, # SOL, and $ total — the price per SOL is computed for you. Swaps show for the month you're viewing, with a month total and an all-time summary (total swapped and average price) in the header."
  },
  {
    keywords: ["usd", "dollar", "price used", "historical price", "valued", "conversion", "convert"],
    answer: "Each day's profit is valued at <strong>that day's actual SOL closing price</strong> (fetched automatically from Coinbase). Today's entry uses the live price until the day ends. Hover any USD amount in the table to see exactly which price was used."
  },
  {
    keywords: ["calendar", "pnl calendar", "calendar image"],
    answer: "On the <strong>💵 Money</strong> tab, hit <strong>📅 Calendar</strong> next to the month arrows. It draws the month's profits as a green/red calendar card with totals, green/red day counts, and your best positive streak — toggle <strong>SOL/USD</strong>, flip months, and hit <strong>Save image</strong> for a PNG you can post."
  },
  {
    keywords: ["share card", "pnl card", "flex", "post my pnl", "share image", "background image", "background video", "axiom", "brag"],
    answer: "On the <strong>💵 Money</strong> tab hit <strong>🖼️ Share card</strong>. It makes an Axiom-style card: your PnL big and bold (green for gain, red for loss) over a background — pick a preset, or upload your own <strong>image or video</strong> (video keeps its sound — toggle \"Include the video's sound\", or tap Hear preview to check it). Choose daily or monthly, a single currency or <strong>All (USD)</strong> to combine SOL, ETH and USDC into one dollar figure, set your username and bottom line (e.g. axiom.trade/icy), then <strong>Save image</strong> (PNG) or <strong>Save video</strong> — pick <strong>MP4</strong> or WebM in the Format dropdown (MP4 records natively when supported, otherwise it's converted in-browser)."
  },
  {
    keywords: ["month", "navigate", "previous month", "ytd", "year to date", "arrows", "month total"],
    answer: "Use the <strong>◀ ▶ arrows</strong> on the Money tab to flip between months. Each month shows its total (green = profit, red = loss), the amount swapped, and a <strong>YTD line</strong> — your running total from January 1 of that year through the month you're viewing."
  },
  {
    keywords: ["asset", "assets", "portfolio", "stock", "crypto", "watch", "holding", "live price", "refresh price"],
    answer: "On <strong>📈 Assets</strong>, add any crypto or stock with the quantity you hold and what you paid — live prices (CoinGecko for crypto, Yahoo for stocks) show your value, 24h change, and gain/loss. Quantity <strong>0</strong> = watch-only: you see the price but it doesn't count toward your portfolio. Prices auto-refresh every 10 minutes."
  },
  {
    keywords: ["food", "calorie", "calories", "meal", "log food", "eat", "ate", "track food"],
    answer: "On <strong>🍎 Food</strong>, type a food name and pick from the database — calories fill in automatically; set servings and log it. Your daily total counts against your calorie goal (changeable on the same tab), and the last-7-days table shows which days you stayed under."
  },
  {
    keywords: ["eating out", "restaurant", "chipotle", "subway", "meal builder", "build a meal", "fast food", "mcdonald", "toppings"],
    answer: "Use <strong>🌯 Build your meal</strong> on the Food tab: pick the restaurant, check off exactly what's in your order (base, protein, toppings, sides), and the calories sum up live — one click logs the whole meal. Don't see your spot? Hit <strong>+ Add restaurant</strong>."
  },
  {
    keywords: ["add restaurant", "new restaurant", "custom menu", "my own restaurant", "local spot", "load menu", "menu automatically"],
    answer: "Click <strong>+ Add restaurant</strong> in the meal builder and <strong>search by name</strong> — there's a built-in library of 40+ chains (McDonald's, Chipotle, Olive Garden, Starbucks, Panda Express…). Pick one and its <strong>full menu loads automatically</strong>, no typing. Only for a spot that isn't listed (a local place) do you create it and add the items yourself — and those custom menus save and sync to your devices."
  },
  {
    keywords: ["peptide", "peptides", "dose", "dosage", "injection", "inject", "medication", "shot", "reminder to take", "bpc", "tirzepatide", "semaglutide"],
    answer: "The <strong>💉 Peptides</strong> tab is a personal dose reminder. Add each peptide with its dose, unit, how often (daily / specific days / every N days), and the time(s) of day. It shows today's schedule with a <strong>Mark taken</strong> button, your next dose, and a Peptides-today panel on the Overview. Turn on <strong>🔔 reminders</strong> to get a browser nudge at each dose time (while the app is open). It's a tracker, not medical advice — follow your provider's protocol."
  },
  {
    keywords: ["habit", "habits", "daily habit", "gym", "water", "routine", "streak habit", "recurring"],
    answer: "The <strong>✅ Daily Habits</strong> popup tracks simple recurring things — Gym, Water, Clean, Read… It pops up once a day so you can check them off; they reset each morning and each habit builds a 🔥 streak. Add your own or tap a suggestion. Open it anytime from the <strong>Daily habits</strong> panel on the Overview (the Open button). Checking habits earns XP, and a 7-day streak unlocks the Habit Hero badge."
  },
  {
    keywords: ["todo", "to-do", "to do", "task", "tasks", "checklist", "pinned note", "paper note"],
    answer: "The <strong>📝 Daily to-do list</strong> lives at the top of the Goals tab — add tasks, check them off, ✕ to remove. It's also pinned to your Overview as the paper note on the right: click a line to check it off, or type in the note to add a task. Finished tasks clear overnight; unfinished ones carry over to today."
  },
  {
    keywords: ["goal", "goals", "target", "progress bar"],
    answer: "On <strong>🎯 Goals</strong>, add anything with a number target — \"Save $5,000\", \"Run 100 miles\". Update progress with <strong>Add</strong> (adds to the total) or <strong>Set total</strong> (replaces it). Goal cards on the Overview work the same way, so you can update without switching tabs."
  },
  {
    keywords: ["xp", "level", "levels", "experience", "title", "rank"],
    answer: "You earn XP for everything: logging a trading day (+10), a green day (+15 more), a +50 SOL day (+10 more), logging meals (+5), staying under your calorie goal (+10), swaps (+5), completed goals (+200), achievements (+50), and weekly challenges (+50 to +100). Levels carry titles from <em>Paper Hands</em> up to <em>Final Boss</em> at level 25. Click the 🏆 badge up top to see your progress."
  },
  {
    keywords: ["achievement", "achievements", "badge", "trophy", "unlock"],
    answer: "The <strong>🏆 Arcade</strong> tab lists all achievements — things like <em>Whale Move</em> (+100 SOL in a day), <em>Monster Month</em> (+1,000 SOL), and <em>Perfect Week</em> (all 5 weekly challenges). They're computed from your data, so history counts retroactively, and a toast pops when you unlock a new one."
  },
  {
    keywords: ["streak", "streaks", "fire", "in a row"],
    answer: "Streak chips on the Overview track consecutive days: 🔥 trading days logged, 📈 green days, 🍎 food logged, 💪 under calorie goal. A day you haven't finished yet doesn't break the streak — but skipping a day resets it to zero."
  },
  {
    keywords: ["weekly", "challenge", "challenges", "quest", "quests", "this week"],
    answer: "<strong>Daily quests</strong> (Arcade) are today's checklist: log your trade, end green, log meals, stay under your calorie goal. <strong>Weekly challenges</strong> (Overview + Arcade) run Monday–Sunday: 3 green days, log 5 days, finish the week net positive, log food 4 days, and 3 days under calorie goal — each pays XP, and completing all 5 in one week unlocks 🌟 Perfect Week."
  },
  {
    keywords: ["account", "log in", "login", "sign up", "signup", "sign in", "password", "google sign"],
    answer: "On the <strong>☁ Sync</strong> tab, the <strong>👤 Account</strong> panel lets you sign up with email + password or continue with Google. Once you're logged in, your data saves to your account automatically and follows you on any device — just log in there too. Signing out leaves your data on the device; logging back in re-syncs it."
  },
  {
    keywords: ["sync", "phone", "devices", "token", "github", "connect", "another device", "link"],
    answer: "Go to <strong>☁ Sync</strong> and follow the 3 steps — it links to GitHub's token page with the right settings pre-filled; generate, copy, paste it in the app. Use the <strong>same token on each device</strong> and they all share one cloud save (a private Gist in your own GitHub account). Changes upload automatically seconds after you log them."
  },
  {
    keywords: ["backup", "export", "restore"],
    answer: "On the <strong>☁ Sync</strong> tab: <strong>⬇ Export backup</strong> downloads all your data as one file; <strong>⬆ Import backup</strong> restores from it (replacing what's on the device). Handy for moving between browsers or keeping an offline copy."
  },
  {
    keywords: ["spreadsheet", "google sheet", "sheets", "excel", "csv", "upload", "import", "previous data", "old data", "migrate"],
    answer: "Got history in Google Sheets or Excel? Use <strong>☁ Sync → 📄 Import from a spreadsheet</strong>. Easiest path: set your Google Sheet's sharing to <em>Anyone with the link — Viewer</em>, paste the link, and hit <strong>Fetch sheet</strong> — the open tab imports directly (you can flip sharing back to Restricted after). Or upload a CSV file instead. Either way you confirm the column mapping with a preview, and it handles $ signs, odd date formats, and days you've already logged."
  },
  {
    keywords: ["data", "stored", "privacy", "private", "where is my data", "who can see", "secure", "safe"],
    answer: "Your data lives <strong>in your browser on your device</strong> (localStorage) — there's no server and no account here. If you enable sync, it's also saved to a <strong>private Gist in your own GitHub account</strong> that only you can access. Nothing is ever sent anywhere else."
  },
  {
    keywords: ["save", "saving", "lose", "shut off", "restart", "persist", "deleted my data"],
    answer: "Everything saves <strong>instantly and automatically</strong> — no save button. Data survives restarts and shutdowns. Two cautions: it's stored per-browser (Chrome and Edge don't share), and clearing your browser's site data erases it — so enable ☁ Sync or take an occasional backup."
  },
  {
    keywords: ["offline", "internet", "no connection", "wifi"],
    answer: "Everything works offline except live prices — logging trades, food, goals, and the meal builder are all local. Prices and the USD conversions update next time you're online."
  },
  {
    keywords: ["install", "home screen", "app icon", "mobile", "shortcut", "desktop"],
    answer: "On your phone: open the site, then <strong>Share → Add to Home Screen</strong> (iPhone) or <strong>⋮ menu → Add to Home screen</strong> (Android) — it gets its own icon and opens full-screen. On PC, bookmark it or drag the address-bar icon to your desktop."
  },
  {
    keywords: ["not updating", "stale", "old version", "cache", "refresh", "don't see", "missing", "broken"],
    answer: "Hard-refresh the page: <strong>Ctrl+Shift+R</strong> on PC, or fully close and reopen the tab on your phone. New versions can take a few minutes to reach your browser after an update. Your data is never affected by refreshing."
  },
  {
    keywords: ["delete", "remove", "clear", "erase", "start over"],
    answer: "Every row and card has a <strong>✕</strong> to delete it (days ask for confirmation). To wipe a device completely, clear the site's data in your browser settings — but remember the cloud copy stays if you've synced, and would restore on next connect."
  },
  {
    keywords: ["calorie goal", "change goal", "2000", "daily goal"],
    answer: "On the <strong>🍎 Food</strong> tab, the <strong>Daily goal</strong> card has the number right in it — click and type a new one. Everything (remaining count, progress bar, streaks, challenges) updates immediately."
  },
  {
    keywords: ["who made", "built", "source", "code", "open source", "github repo"],
    answer: "This app is a static web app — plain HTML, CSS, and JavaScript, hosted free on GitHub Pages. The source code lives in the owner's GitHub repository."
  },
  {
    keywords: ["demo", "sample data", "fake data", "try it", "is this real"],
    answer: "You're in <strong>demo mode</strong> if there's a banner up top — a sandbox where you can try everything without it being saved to any account. Click <strong>Exit demo</strong> in the banner to use the app for real. Demo entries never touch anyone's real numbers."
  },
  {
    keywords: ["hello", "hi", "hey", "yo", "sup", "morning"],
    answer: "Hey! 👋 Ask me anything about the app — logging trades, syncing your phone, the meal builder, XP… or tap one of the suggestions below."
  },
  {
    keywords: ["thanks", "thank you", "ty", "thx", "appreciate"],
    answer: "Anytime! 🙌 If something seems off or you wish the app did something it doesn't, that kind of feedback is worth writing down."
  },
];

const CHAT_SUGGESTIONS = [
  "How do I sync my phone?",
  "How do I log a trading day?",
  "How does eating out work?",
  "What earns XP?",
  "Where is my data stored?",
  "How do streaks work?",
  "What are weekly challenges?",
  "How do I add a restaurant?",
  "How do USD values work?",
  "How do I back up my data?",
];

function chatAnswer(text) {
  const q = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const intent of CHAT_INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (q.includes(kw)) score += kw.includes(" ") ? 2 : 1; // phrases beat single words
    }
    if (score > bestScore) { bestScore = score; best = intent; }
  }
  if (best) return best.answer;
  return "Hmm, I don't have an answer for that one. I can help with: <strong>logging trades & notes</strong>, <strong>swaps</strong>, <strong>assets & prices</strong>, <strong>food & the meal builder</strong>, <strong>goals</strong>, <strong>XP, streaks & challenges</strong>, and <strong>sync & backups</strong>. Try one of the suggestions below!";
}

/* ----- UI ----- */
const chatFab = document.getElementById("chat-fab");
const chatPanel = document.getElementById("chat-panel");
const chatMsgs = document.getElementById("chat-msgs");
const chatChips = document.getElementById("chat-chips");

function chatAdd(who, html) {
  const el = document.createElement("div");
  el.className = "chat-msg " + who;
  el.innerHTML = html;
  chatMsgs.appendChild(el);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function chatChipsRender() {
  const picks = [...CHAT_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 3);
  chatChips.innerHTML = picks.map(s => `<button type="button" class="chat-chip">${s}</button>`).join("");
  chatChips.querySelectorAll(".chat-chip").forEach(b =>
    b.addEventListener("click", () => chatSend(b.textContent)));
}

function chatSend(text) {
  text = text.trim();
  if (!text) return;
  chatAdd("user", text.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])));
  const typing = document.createElement("div");
  typing.className = "chat-msg bot typing";
  typing.textContent = "…";
  chatMsgs.appendChild(typing);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  setTimeout(() => {
    typing.remove();
    chatAdd("bot", chatAnswer(text));
    chatChipsRender();
  }, 450);
}

chatFab.addEventListener("click", () => {
  const open = chatPanel.style.display !== "none";
  chatPanel.style.display = open ? "none" : "flex";
  chatFab.classList.toggle("open", !open);
  if (!open && !chatMsgs.children.length) {
    chatAdd("bot", "Hey, I'm <strong>Dash</strong> 👋 — your guide to this app. Ask me how anything works, or tap a suggestion below.");
    chatChipsRender();
  }
});

document.getElementById("chat-close").addEventListener("click", () => {
  chatPanel.style.display = "none";
  chatFab.classList.remove("open");
});

document.getElementById("chat-form").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("chat-text");
  chatSend(input.value);
  input.value = "";
});
