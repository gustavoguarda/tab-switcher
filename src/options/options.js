import { loadSettings, saveSettings } from "../storage.js";

// --- i18n: fill text/markup from the browser-selected locale ---
const t = (key) => chrome.i18n.getMessage(key) || "";

function applyI18n() {
  const title = t("optTitle");
  if (title) document.title = title;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const m = t(el.dataset.i18n);
    if (m) el.textContent = m;
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const m = t(el.dataset.i18nHtml);
    if (m) el.innerHTML = m;
  });
}

applyI18n();

// The advanced override section instructs running a developerPrivate snippet,
// which only makes sense for unpacked/dev installs. Reveal it only there; in the
// published (store) build it stays hidden.
try {
  chrome.management.getSelf((info) => {
    if (info && info.installType === "development") {
      const adv = document.getElementById("advancedSection");
      if (adv) adv.hidden = false;
    }
  });
} catch (e) {
  // chrome.management unavailable — keep the section hidden
}

const input = document.getElementById("cardCount");
const thumbsCheck = document.getElementById("thumbnails");
const status = document.getElementById("status");

// In-memory copy of the full settings object.
// All saves always write the full object so no field is lost.
let current = null;

function showSaved() {
  status.textContent = t("statusSaved") || "Saved";
  setTimeout(() => { status.textContent = ""; }, 1200);
}

async function init() {
  current = await loadSettings();
  input.value = current.cardCount;

  thumbsCheck.checked = !!current.thumbnails;
}

input.addEventListener("change", async () => {
  let n = parseInt(input.value, 10);
  if (Number.isNaN(n)) n = 6;
  n = Math.max(4, Math.min(9, n));
  input.value = n;
  current.cardCount = n;
  await saveSettings(current);
  showSaved();
});

thumbsCheck.addEventListener("change", async () => {
  current.thumbnails = thumbsCheck.checked;
  await saveSettings(current);
  if (!current.thumbnails) {
    // Drop cached screenshots when turning previews off.
    chrome.storage.session.remove("thumbs").catch(() => {});
  }
  showSaved();
});

// --- Override snippet generator (cycle-back → Cmd/Ctrl+Shift+E) ---
const overrideCode = document.getElementById("overrideCode");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");

function isMac() {
  const p =
    (navigator.userAgentData && navigator.userAgentData.platform) ||
    navigator.platform ||
    "";
  return /mac/i.test(p);
}

const keybinding = isMac() ? "Command+Shift+E" : "Ctrl+Shift+E";

const snippet =
  "chrome.developerPrivate.updateExtensionCommand({\n" +
  '  extensionId: "' + chrome.runtime.id + '",\n' +
  '  commandName: "cycle-back",\n' +
  '  keybinding: "' + keybinding + '"\n' +
  "});";

overrideCode.textContent = snippet;

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(snippet);
    copyStatus.textContent = t("copyDone") || "Copied!";
  } catch (e) {
    copyStatus.textContent = t("copyFail") || "Couldn't copy — select and copy manually.";
  }
  setTimeout(() => { copyStatus.textContent = ""; }, 2000);
});

init();
