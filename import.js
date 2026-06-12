/* ============ Spreadsheet (CSV) importer ============ */
// Users coming from Google Sheets / Excel export their sheet as CSV and
// upload it here. Columns are auto-detected from headers, the user confirms
// the mapping with a preview, and rows become trades or swaps.

let impRows = [];   // parsed CSV rows
let impHeader = []; // header row labels (may be synthetic "Column 1..")

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(f => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(f => f.trim() !== "")) rows.push(row);
  return rows;
}

function impParseDate(v) {
  v = String(v).trim();
  if (!v) return null;
  // ISO: 2026-06-11
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  // US: 6/11/26, 6-11-2026
  m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    const mo = +m[1], d = +m[2];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    if (d > new Date(y, mo, 0).getDate()) return null; // 11/31 etc.
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  // Excel serial number
  const n = parseFloat(v);
  if (isFinite(n) && n > 20000 && n < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return d.toISOString().slice(0, 10);
  }
  // last resort: let the browser try ("Jun 11, 2026")
  const d = new Date(v);
  if (!isNaN(d) && d.getFullYear() > 2000) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}

function impParseNum(v) {
  v = String(v).trim().replace(/[$,\s]/g, "");
  if (v.startsWith("(") && v.endsWith(")")) v = "-" + v.slice(1, -1); // (50) = -50
  const n = parseFloat(v);
  return isFinite(n) ? n : null;
}

const IMP_FIELDS = {
  trades: [
    { key: "date", label: "Date", hints: ["date", "day"] },
    { key: "start", label: "Starting balance", hints: ["start", "begin", "open"] },
    { key: "end", label: "Ending balance", hints: ["end", "close", "final"] },
  ],
  swaps: [
    { key: "date", label: "Date", hints: ["date", "day"] },
    { key: "sol", label: "# of coin", hints: ["#", "sol", "amount", "qty", "coin"] },
    { key: "usd", label: "$ total", hints: ["$", "usd", "total", "value"] },
  ],
};

document.getElementById("imp-file").addEventListener("change", e => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => impLoadText(String(reader.result));
  reader.readAsText(file);
});

function impLoadText(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) {
    document.getElementById("imp-status").textContent = "Couldn't find any data rows in that file.";
    return;
  }
  // header row = first row with no parseable date and no plain numbers
  const firstLooksLikeHeader = rows[0].every(c => impParseDate(c) === null) &&
    rows[0].some(c => isNaN(parseFloat(String(c).replace(/[$,]/g, ""))));
  impHeader = firstLooksLikeHeader ? rows[0].map((c, i) => c.trim() || `Column ${i + 1}`)
    : rows[0].map((c, i) => `Column ${i + 1}`);
  impRows = firstLooksLikeHeader ? rows.slice(1) : rows;
  renderImpMap();
  document.getElementById("imp-status").textContent = "";
}

function renderImpMap() {
  const type = document.getElementById("imp-type").value;
  const fields = IMP_FIELDS[type];
  const wrap = document.getElementById("imp-map");
  wrap.style.display = "";

  const colOptions = sel => impHeader.map((h, i) =>
    `<option value="${i}" ${i === sel ? "selected" : ""}>${h.replace(/</g, "&lt;")}</option>`).join("");

  // auto-detect: match header keywords, fall back to column position
  const guesses = fields.map((f, fi) => {
    const byName = impHeader.findIndex(h => f.hints.some(k => h.toLowerCase().includes(k)));
    return byName >= 0 ? byName : Math.min(fi, impHeader.length - 1);
  });

  wrap.innerHTML = `
    <div class="row" style="margin-top:12px">
      ${fields.map((f, fi) => `
        <label class="field">${f.label}
          <select class="imp-col" data-key="${f.key}">${colOptions(guesses[fi])}</select>
        </label>`).join("")}
      <label class="field">If a date already exists
        <select id="imp-dupes">
          <option value="skip">Keep my entry (skip)</option>
          <option value="overwrite">Use the file's entry</option>
        </select>
      </label>
    </div>
    <table style="margin-top:12px">
      <thead><tr>${impHeader.map(h => `<th>${h.replace(/</g, "&lt;")}</th>`).join("")}</tr></thead>
      <tbody>${impRows.slice(0, 5).map(r =>
        `<tr>${impHeader.map((_, i) => `<td>${String(r[i] ?? "").replace(/</g, "&lt;").slice(0, 24)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
    <p class="muted" style="margin:8px 0">${impRows.length} data rows found — first 5 shown. Check the column mapping above, then import.</p>
    <button class="btn" id="imp-go" type="button">Import ${impRows.length} rows</button>`;

  document.getElementById("imp-go").addEventListener("click", impImport);
}

function impImport() {
  const type = document.getElementById("imp-type").value;
  const coin = document.getElementById("imp-coin").value;
  const overwrite = document.getElementById("imp-dupes").value === "overwrite";
  const cols = {};
  document.querySelectorAll(".imp-col").forEach(s => cols[s.dataset.key] = +s.value);

  let added = 0, replaced = 0, skipped = 0, bad = 0;

  for (const r of impRows) {
    const date = impParseDate(r[cols.date]);
    if (!date) { bad++; continue; }

    if (type === "trades") {
      const start = impParseNum(r[cols.start]);
      const end = impParseNum(r[cols.end]);
      if (start === null || end === null || (start === 0 && end === 0)) { bad++; continue; }
      const existing = trades.find(t => t.date === date);
      if (existing) {
        if (!overwrite) { skipped++; continue; }
        existing.startSol = start; existing.endSol = end; existing.coin = coin;
        replaced++;
      } else {
        trades.push({ id: uid(), date, startSol: start, endSol: end, coin });
        added++;
      }
    } else {
      const sol = impParseNum(r[cols.sol]);
      const usd = impParseNum(r[cols.usd]);
      if (!sol || !usd || sol <= 0 || usd <= 0) { bad++; continue; }
      if (swaps.some(s => s.date === date && s.sol === sol && s.usd === usd)) { skipped++; continue; }
      swaps.push({ id: uid(), date, sol, usd });
      added++;
    }
  }

  if (type === "trades") store.save("life.trades", trades);
  else store.save("life.swaps", swaps);

  document.getElementById("imp-map").style.display = "none";
  const parts = [`${added} added`];
  if (replaced) parts.push(`${replaced} overwritten`);
  if (skipped) parts.push(`${skipped} skipped (already logged)`);
  if (bad) parts.push(`${bad} rows unreadable (bad date or empty values)`);
  document.getElementById("imp-status").textContent = `✅ Import done: ${parts.join(", ")}.`;

  renderMoney(); renderDashboard();
  ensureSolPrice();
  ensureSolHistory(); // fetch day-of prices for the imported dates
}

document.getElementById("imp-type").addEventListener("change", () => {
  if (impRows.length) renderImpMap();
});

/* ----- fetch a link-shared Google Sheet directly ----- */
document.getElementById("imp-fetch").addEventListener("click", fetchSheet);
document.getElementById("imp-url").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); fetchSheet(); }
});

async function fetchSheet() {
  const url = document.getElementById("imp-url").value.trim();
  const status = document.getElementById("imp-status");
  const m = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) {
    status.textContent = "That doesn't look like a Google Sheets link — it should contain /spreadsheets/d/…";
    return;
  }
  const id = m[1];
  const gid = (url.match(/[#?&]gid=(\d+)/) || [])[1] || "0";
  status.textContent = "Fetching your sheet from Google…";
  try {
    // gviz CSV endpoint allows cross-origin reads for link-shared sheets
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`);
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    if (text.trim().startsWith("<")) throw new Error("html"); // got a sign-in page
    impLoadText(text);
    if (impRows.length) status.textContent = `Fetched ${impRows.length} rows — check the column mapping below.`;
  } catch {
    status.textContent = "Couldn't read that sheet. Make sure sharing is set to “Anyone with the link — Viewer” (Share button, top right in Google Sheets), then try again.";
  }
}
