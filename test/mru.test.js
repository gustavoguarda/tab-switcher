import { test, expect } from "vitest";
import { recordActivation, removeTab, removeWindow, getMru } from "../src/mru.js";

test("recordActivation puts the tab at the front of its window", () => {
  let s = {};
  s = recordActivation(s, 1, 100);
  s = recordActivation(s, 1, 200);
  expect(getMru(s, 1)).toEqual([200, 100]);
});

test("recordActivation dedups: re-activating moves to front without duplicating", () => {
  let s = {};
  s = recordActivation(s, 1, 100);
  s = recordActivation(s, 1, 200);
  s = recordActivation(s, 1, 100);
  expect(getMru(s, 1)).toEqual([100, 200]);
});

test("windows are isolated", () => {
  let s = {};
  s = recordActivation(s, 1, 100);
  s = recordActivation(s, 2, 300);
  expect(getMru(s, 1)).toEqual([100]);
  expect(getMru(s, 2)).toEqual([300]);
});

test("removeTab removes a tab id from every window", () => {
  let s = {};
  s = recordActivation(s, 1, 100);
  s = recordActivation(s, 2, 100);
  s = recordActivation(s, 2, 300);
  s = removeTab(s, 100);
  expect(getMru(s, 1)).toEqual([]);
  expect(getMru(s, 2)).toEqual([300]);
});

test("removeWindow drops the whole window list", () => {
  let s = {};
  s = recordActivation(s, 1, 100);
  s = removeWindow(s, 1);
  expect(getMru(s, 1)).toEqual([]);
});

test("getMru returns an empty array for unknown windows", () => {
  expect(getMru({}, 99)).toEqual([]);
});

test("functions do not mutate the input state", () => {
  const s = {};
  recordActivation(s, 1, 100);
  expect(s).toEqual({});
});
