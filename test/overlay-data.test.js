import { test, expect } from "vitest";
import { orderedIds, selectOverlayTabs } from "../src/overlay-data.js";

test("orderedIds uses MRU order when it is non-empty", () => {
  expect(orderedIds([200, 100], [100, 200, 300])).toEqual([200, 100]);
});

test("orderedIds falls back to window tab order when MRU is empty", () => {
  expect(orderedIds([], [100, 200, 300])).toEqual([100, 200, 300]);
});

test("selectOverlayTabs maps ids to tab info, skipping ids with no live tab", () => {
  const tabsById = {
    100: { id: 100, title: "A", favIconUrl: "a.png", url: "https://a" },
    300: { id: 300, title: "C", favIconUrl: "c.png", url: "https://c" },
  };
  const cards = selectOverlayTabs([200, 100, 300], tabsById, 6);
  expect(cards.map((c) => c.id)).toEqual([100, 300]);
});

test("selectOverlayTabs respects the limit", () => {
  const tabsById = {
    1: { id: 1, title: "1" }, 2: { id: 2, title: "2" }, 3: { id: 3, title: "3" },
  };
  const cards = selectOverlayTabs([1, 2, 3], tabsById, 2);
  expect(cards.map((c) => c.id)).toEqual([1, 2]);
});
