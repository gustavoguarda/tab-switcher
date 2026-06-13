// Thin wrappers over chrome.storage. MRU state lives in session
// (cleared on browser restart); settings live in sync.

const STATE_KEY = "mruState";
const SETTINGS_KEY = "settings";

export const DEFAULT_SETTINGS = { cardCount: 6, thumbnails: false };

export async function loadState() {
  const r = await chrome.storage.session.get(STATE_KEY);
  return r[STATE_KEY] || {};
}

export async function saveState(state) {
  await chrome.storage.session.set({ [STATE_KEY]: state });
}

export async function loadSettings() {
  const r = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(r[SETTINGS_KEY] || {}) };
}

export async function saveSettings(settings) {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}
