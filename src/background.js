import { recordActivation, removeTab, removeWindow, getMru } from "./mru.js";
import { orderedIds, selectOverlayTabs } from "./overlay-data.js";
import { loadState, saveState, loadSettings } from "./storage.js";

const META_KEY = "overlayMeta";
const THUMBS_KEY = "thumbs";
const THUMB_MAX = 12;

// --- Thumbnail cache ---
async function loadThumbs() {
  const r = await chrome.storage.session.get(THUMBS_KEY);
  return r[THUMBS_KEY] || {};
}

async function saveThumbs(obj) {
  await chrome.storage.session.set({ [THUMBS_KEY]: obj });
}

async function captureActiveTab(windowId, tabId) {
  const settings = await loadSettings();
  if (!settings.thumbnails) return;

  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch (e) {
    return;
  }
  if (!tab || tab.windowId !== windowId || tab.active !== true) return;

  const url = tab.url || "";
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("file://")) {
    return;
  }

  // Don't capture while our modal is showing on this tab.
  const { [META_KEY]: meta } = await chrome.storage.session.get(META_KEY);
  if (meta && meta.tabId === tabId) return;

  let dataUrl;
  try {
    dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 40 });
  } catch (e) {
    return;
  }

  const thumbs = await loadThumbs();
  delete thumbs[tabId];
  thumbs[tabId] = dataUrl;
  while (Object.keys(thumbs).length > THUMB_MAX) {
    delete thumbs[Object.keys(thumbs)[0]];
  }
  await saveThumbs(thumbs);
}

// --- MRU tracking ---
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  const state = await loadState();
  await saveState(recordActivation(state, windowId, tabId));
  await new Promise((r) => setTimeout(r, 250)); // let the tab paint before capture
  await captureActiveTab(windowId, tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    await captureActiveTab(tab.windowId, tabId);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await loadState();
  await saveState(removeTab(state, tabId));

  const thumbs = await loadThumbs();
  if (Object.prototype.hasOwnProperty.call(thumbs, tabId)) {
    delete thumbs[tabId];
    await saveThumbs(thumbs);
  }

  // If the switcher is open, drop the closed tab's card (or clear state if the
  // host tab itself closed).
  const { [META_KEY]: meta } = await chrome.storage.session.get(META_KEY);
  if (!meta) return;
  if (meta.tabId === tabId) {
    await clearMeta();
    return;
  }
  try {
    await chrome.tabs.sendMessage(meta.tabId, { type: "remove", tabId });
  } catch (e) {
    // modal gone — ignore
  }
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const state = await loadState();
  await saveState(removeWindow(state, windowId));
});

// --- Shortcut: open / cycle ---
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-switcher" && command !== "cycle-back") return;
  const dir = command === "open-switcher" ? 1 : -1;

  const { [META_KEY]: meta } = await chrome.storage.session.get(META_KEY);
  if (meta) {
    // Switcher already open → advance the modal on its tab.
    let resp;
    try {
      resp = await chrome.tabs.sendMessage(meta.tabId, { type: "advance", dir });
    } catch (e) {
      // The modal's tab/context is gone — clear and open fresh so a press is
      // never wasted.
      await clearMeta();
      await openSwitcher(dir);
      return;
    }
    if (resp && resp.stale) {
      // The modal reports it's actually hidden (stale meta) — reopen fresh.
      await clearMeta();
      await openSwitcher(dir);
    }
    return;
  }

  await openSwitcher(dir);
});

async function openSwitcher(startDir) {
  const win = await chrome.windows.getLastFocused({ populate: true });
  if (!win || !win.tabs) return;

  const [state, settings, thumbs] = await Promise.all([
    loadState(),
    loadSettings(),
    loadThumbs(),
  ]);

  const tabsById = {};
  const urlById = {};
  for (const t of win.tabs) {
    urlById[t.id] = t.url || "";
    tabsById[t.id] = {
      id: t.id,
      title: t.title || t.url || "(untitled)",
      favIconUrl: t.favIconUrl || "",
      thumbnail: thumbs[t.id] || "",
    };
  }

  const ids = orderedIds(getMru(state, win.id), win.tabs.map((t) => t.id));
  const cards = selectOverlayTabs(ids, tabsById, settings.cardCount);
  if (cards.length < 2) return; // nothing meaningful to switch to

  const startIndex = startDir > 0 ? 1 : cards.length - 1;

  const activeTabs = await chrome.tabs.query({ active: true, windowId: win.id });
  const activeTab = activeTabs[0];
  const originTabId = activeTab ? activeTab.id : null;

  if (activeTab) {
    try {
      // The content modal is normally already present on http/https pages, so
      // this reaches a ready listener with no injection race.
      await chrome.tabs.sendMessage(activeTab.id, { type: "show", cards, startIndex });
      await chrome.storage.session.set({
        [META_KEY]: { tabId: activeTab.id, originWindowId: win.id, originTabId },
      });
      return;
    } catch (e) {
      // No live content script (tab was open before the extension was
      // (re)loaded). If it's a web page we can inject on demand; restricted
      // pages (edge://, New Tab, PDF) throw and fall through.
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["src/content/modal.js"],
        });
        await chrome.tabs.sendMessage(activeTab.id, { type: "show", cards, startIndex });
        await chrome.storage.session.set({
          [META_KEY]: { tabId: activeTab.id, originWindowId: win.id, originTabId },
        });
        return;
      } catch (e2) {
        // Restricted page — fall through to the host-tab / direct-jump path.
      }
    }
  }

  // The active tab can't host the modal (edge://, New Tab, PDF, error page).
  // Render the switcher on the most-recent WEB tab instead: activate it and
  // show the modal there, preselected on itself — so a quick release lands on
  // your previous tab, and holding lets you cycle visually.
  const hostId = ids.find((id) => isWebUrl(urlById[id] || ""));
  if (hostId != null) {
    const hostIndex = cards.findIndex((c) => c.id === hostId);
    try {
      await chrome.tabs.update(hostId, { active: true });
      await chrome.tabs.sendMessage(hostId, {
        type: "show",
        cards,
        startIndex: hostIndex >= 0 ? hostIndex : 0,
      });
      await chrome.windows.update(win.id, { focused: true });
      await chrome.storage.session.set({
        [META_KEY]: { tabId: hostId, originWindowId: win.id, originTabId },
      });
      return;
    } catch (e) {
      // host tab not reachable (e.g. not yet injected) — fall through
    }
  }

  // Last resort: no web tab to host the modal — just jump to the previous tab.
  const target = cards[1] || cards[0];
  if (target) {
    try {
      await chrome.tabs.update(target.id, { active: true });
      await chrome.windows.update(win.id, { focused: true });
    } catch (e) {
      // tab gone — ignore
    }
  }
}

function isWebUrl(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

// --- Commit / cancel from the modal ---
// Return true and respond after the work finishes so the MV3 service worker is
// kept alive for the whole async chain (otherwise it can be evicted mid-teardown
// and leave overlayMeta set, breaking the next open).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).finally(() => {
    try {
      sendResponse({ ok: true });
    } catch (e) {
      // channel already closed — fine
    }
  });
  return true;
});

async function handleMessage(msg) {
  if (!msg || (msg.type !== "select" && msg.type !== "cancel")) return;

  const { [META_KEY]: meta } = await chrome.storage.session.get(META_KEY);
  if (!meta) return;

  if (msg.type === "select" && typeof msg.tabId === "number") {
    try {
      await chrome.tabs.update(msg.tabId, { active: true });
      await chrome.windows.update(meta.originWindowId, { focused: true });
    } catch (e) {
      // tab may have closed mid-cycle — ignore
    }
  } else if (msg.type === "cancel" && meta.originTabId != null) {
    // Cancel means "leave things as they were". If the switcher auto-switched
    // away from an internal page to host the modal, return to where the user
    // was. (On a normal page the origin tab is already active — a no-op.)
    try {
      await chrome.tabs.update(meta.originTabId, { active: true });
      await chrome.windows.update(meta.originWindowId, { focused: true });
    } catch (e) {
      // origin tab closed — ignore
    }
  }

  try {
    await chrome.tabs.sendMessage(meta.tabId, { type: "hide" });
  } catch (e) {
    // modal already gone — ignore
  }
  await clearMeta();
}

async function clearMeta() {
  await chrome.storage.session.remove(META_KEY);
}
