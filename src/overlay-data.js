// Pure helpers that turn MRU ids + live tab info into renderable cards.

export function orderedIds(mruIds, windowTabIds) {
  return mruIds.length ? mruIds : windowTabIds;
}

export function selectOverlayTabs(ids, tabsById, limit) {
  const cards = [];
  for (const id of ids) {
    const tab = tabsById[id];
    if (tab) cards.push(tab);
    if (cards.length >= limit) break;
  }
  return cards;
}
