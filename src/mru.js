// Per-window MRU ordering. Pure functions, no chrome APIs.
// State shape: { [windowId: string]: number[] } — tab ids, most-recent-first.

export function recordActivation(state, windowId, tabId) {
  const key = String(windowId);
  const prev = state[key] || [];
  const next = [tabId, ...prev.filter((id) => id !== tabId)];
  return { ...state, [key]: next };
}

export function removeTab(state, tabId) {
  const next = {};
  for (const [key, list] of Object.entries(state)) {
    next[key] = list.filter((id) => id !== tabId);
  }
  return next;
}

export function removeWindow(state, windowId) {
  const next = { ...state };
  delete next[String(windowId)];
  return next;
}

export function getMru(state, windowId) {
  return state[String(windowId)] || [];
}
