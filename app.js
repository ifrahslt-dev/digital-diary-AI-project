const STORAGE_KEY = "littleDiary.entries.v1";
const SETTINGS_KEY = "littleDiary.settings.v1";
const MOOD_KEY = "littleDiary.moods.v1";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const today = () => new Date().toLocaleDateString("en-CA");
const prettyDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const moodEmoji = (mood = "") => ({
  Amazing: "😄", Good: "😊", Okay: "😌", Low: "🥺", Rough: "🌧️", Loved: "🥰", Hopeful: "🌱"
})[mood.replace(/^[^\w]+/u, "").trim()] || "♡";
const moodName = (mood = "") => mood.replace(/^[^\w]+/u, "").trim();
let entries = readJSON(STORAGE_KEY, []);
let moods = readJSON(MOOD_KEY, {});
let settings = readJSON(SETTINGS_KEY, { name: "", theme: "pink" });
let editingId = null;
let toastTimer;

function readJSON(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
}
function saveAll() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  localStorage.setItem(MOOD_KEY, JSON.stringify(moods));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function go(view) {
  $$(".view").forEach(section => section.classList.toggle("hidden", section.id !== `${view}-view`));
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  const titles = {
    home: ["YOUR LITTLE SPACE", `Hello, ${settings.name || "lovely human"} ♡`, "A place to keep the little things."],
    write: ["A PAGE JUST FOR YOU", "Dear diary... ♡", "Write whatever is on your mind."],
    gallery: ["YOUR PERSONAL COLLECTION", "Memory garden ✿", "All the little moments you've decided to keep."],
    moods: ["BE KIND TO YOURSELF", "Your mood garden ☁", "There is room for every feeling here."],
    settings: ["MAKE YOURSELF AT HOME", "Little settings ⚙", "Make this diary feel a little more like you."]
  };
  const title = titles[view] || titles.home;
  $("#today-label").textContent = title[0];
  $("#greeting").innerHTML = `${escapeHTML(title[1])}`;
  $("#subtitle").textContent = title[2];
  if (view === "home") renderHome();
  if (view === "gallery") renderGallery();
  if (view === "moods") renderMoods();
  if (view === "settings") $("#display-name").value = settings.name || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function entryCard(entry) {
  const image = entry.image
    ? `<div class="entry-image"><img src="${escapeHTML(entry.image)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='🌷'"></div>`
    : `<div class="entry-image">${moodEmoji(entry.mood)}</div>`;
  const snippet = entry.content.length > 170 ? `${entry.content.slice(0, 170)}…` : entry.content;
  return `<article class="entry-card">
    ${image}<div class="entry-body">
      <div class="entry-meta"><span>${escapeHTML(prettyDate(entry.date))}</span><span>${moodEmoji(entry.mood)} ${escapeHTML(moodName(entry.mood))}</span></div>
      <h3>${escapeHTML(entry.title)}</h3><p>${escapeHTML(snippet)}</p>
      <div class="entry-actions"><button data-edit="${entry.id}">Edit entry</button><button class="delete-entry" data-delete="${entry.id}">Delete</button></div>
    </div></article>`;
}
function renderHome() {
  const recent = [...entries].sort((a,b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 3);
  $("#recent-entries").innerHTML = recent.map(entryCard).join("");
  $("#home-empty").classList.toggle("hidden", entries.length > 0);
  $("#recent-entries").classList.toggle("hidden", entries.length === 0);
  $$("#quick-moods .mood-option").forEach(button => button.classList.toggle("selected", moods[today()] === button.dataset.mood));
  $("#mood-date").textContent = moods[today()] ? `Today: ${moodEmoji(moods[today()])} ${moods[today()]}` : "Today's mood";
}
function renderGallery() {
  const query = $("#search-entries").value.toLowerCase().trim();
  const filter = $("#filter-mood").value;
  const found = [...entries].sort((a,b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .filter(entry => (!filter || moodName(entry.mood) === filter) && (!query || `${entry.title} ${entry.content} ${entry.date} ${entry.mood}`.toLowerCase().includes(query)));
  $("#all-entries").innerHTML = found.map(entryCard).join("");
  $("#gallery-empty").classList.toggle("hidden", found.length > 0);
}
function renderMoods() {
  const counts = Object.values(moods).reduce((acc, mood) => { acc[mood] = (acc[mood] || 0) + 1; return acc; }, {});
  const total = Object.keys(moods).length;
  const mostCommon = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
  $("#mood-summary").innerHTML = `
    <div class="summary-card"><span>🌱</span><strong>${total}</strong><small>days checked in</small></div>
    <div class="summary-card"><span>${mostCommon ? moodEmoji(mostCommon[0]) : "♡"}</span><strong>${mostCommon ? escapeHTML(mostCommon[0]) : "Not yet"}</strong><small>most common mood</small></div>
    <div class="summary-card"><span>📔</span><strong>${entries.length}</strong><small>memories written</small></div>`;
  const history = Object.entries(moods).sort((a,b) => b[0].localeCompare(a[0]));
  $("#mood-history").innerHTML = history.length ? history.slice(0, 30).map(([date,mood]) => `<div class="mood-history-row"><span class="emoji">${moodEmoji(mood)}</span><div><strong>${escapeHTML(mood)}</strong><small>${escapeHTML(prettyDate(date))}</small></div></div>`).join("") : `<div class="empty-state"><div class="empty-illustration">☁️</div><h3>Your feelings belong here</h3><p>Choose a mood on the home page to start your mood garden.</p></div>`;
}
function startNewEntry() {
  editingId = null;
  $("#entry-form").reset();
  $("#entry-date").value = today();
  $("#editor-title").textContent = "Dear diary... ♡";
  $("#entry-form").querySelector('button[type="submit"]').textContent = "Save this memory ✿";
  go("write");
  $("#entry-title").focus();
}
function editEntry(id) {
  const entry = entries.find(item => item.id === id);
  if (!entry) return;
  editingId = id;
  $("#entry-title").value = entry.title;
  $("#entry-date").value = entry.date;
  $("#entry-mood").value = entry.mood;
  $("#entry-content").value = entry.content;
  $("#entry-image").value = entry.image || "";
  $("#editor-title").textContent = "A memory to revisit ♡";
  $("#entry-form").querySelector('button[type="submit"]').textContent = "Update memory ✿";
  go("write");
}
function deleteEntry(id) {
  const entry = entries.find(item => item.id === id);
  if (!entry || !confirm(`Delete "${entry.title}"? This cannot be undone unless you exported a backup.`)) return;
  entries = entries.filter(item => item.id !== id);
  saveAll(); renderHome(); renderGallery(); showToast("Memory removed.");
}
function handleCardAction(event) {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editEntry(editButton.dataset.edit);
  if (deleteButton) deleteEntry(deleteButton.dataset.delete);
}

$$(".nav-item").forEach(button => button.addEventListener("click", () => button.dataset.view === "write" ? startNewEntry() : go(button.dataset.view)));
$$("[data-go]").forEach(button => button.addEventListener("click", () => button.dataset.go === "write" ? startNewEntry() : go(button.dataset.go)));
$("#header-new").addEventListener("click", startNewEntry);
$("#hero-write").addEventListener("click", startNewEntry);
$("#empty-write").addEventListener("click", startNewEntry);
$("#cancel-edit").addEventListener("click", () => go("home"));
$("#recent-entries").addEventListener("click", handleCardAction);
$("#all-entries").addEventListener("click", handleCardAction);
$("#search-entries").addEventListener("input", renderGallery);
$("#filter-mood").addEventListener("change", renderGallery);

$("#entry-form").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#entry-title").value.trim();
  const content = $("#entry-content").value.trim();
  if (!title || !content) return showToast("Add a title and a few words first ♡");
  const existing = entries.find(item => item.id === editingId);
  const entry = {
    id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    title, date: $("#entry-date").value || today(),
    mood: moodName($("#entry-mood").value), content,
    image: $("#entry-image").value.trim(),
    createdAt: existing?.createdAt || Date.now()
  };
  entries = editingId ? entries.map(item => item.id === editingId ? entry : item) : [entry, ...entries];
  saveAll(); $("#entry-form").reset(); editingId = null;
  showToast("Your memory has been tucked away safely ♡");
  go("home");
});

$("#quick-moods").addEventListener("click", event => {
  const button = event.target.closest("[data-mood]");
  if (!button) return;
  moods[today()] = button.dataset.mood;
  saveAll(); renderHome();
  showToast(`Mood saved: ${button.dataset.mood} ${moodEmoji(button.dataset.mood)}`);
});
$("#display-name").addEventListener("change", event => {
  settings.name = event.target.value.trim();
  saveAll(); go("settings"); showToast("Your diary has your name now ♡");
});
$$("[data-theme]").forEach(button => button.addEventListener("click", () => {
  settings.theme = button.dataset.theme; applyTheme(); saveAll(); showToast("A fresh little look for your diary ✿");
}));
function applyTheme() {
  document.body.dataset.theme = settings.theme || "pink";
  $$(".theme-swatch").forEach(button => button.style.outline = button.dataset.theme === settings.theme ? "2px solid var(--accent)" : "none");
}
$("#export-data").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ entries, moods, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "little-diary-backup.json"; link.click();
  URL.revokeObjectURL(url); showToast("Your backup is ready to keep somewhere safe.");
});
$("#clear-data").addEventListener("click", () => {
  if (!confirm("This will permanently remove all entries and mood check-ins from this browser. Export a backup first if you want to keep them. Continue?")) return;
  entries = []; moods = {}; saveAll(); renderHome(); renderGallery(); renderMoods(); showToast("Your diary is cleared.");
});
$("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
$("#entry-date").value = today();
applyTheme();
go("home");
