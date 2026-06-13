import { test, expect, beforeEach } from "vitest";
import {
  loadState, saveState, loadSettings, saveSettings, DEFAULT_SETTINGS,
} from "../src/storage.js";

function makeArea() {
  const data = {};
  return {
    data,
    async get(keys) {
      if (typeof keys === "string") return { [keys]: data[keys] };
      const out = {};
      for (const k of keys) out[k] = data[k];
      return out;
    },
    async set(obj) {
      Object.assign(data, obj);
    },
  };
}

beforeEach(() => {
  globalThis.chrome = { storage: { session: makeArea(), sync: makeArea() } };
});

test("loadState returns {} when nothing stored", async () => {
  expect(await loadState()).toEqual({});
});

test("saveState then loadState round-trips", async () => {
  await saveState({ "1": [100, 200] });
  expect(await loadState()).toEqual({ "1": [100, 200] });
});

test("loadSettings returns defaults when nothing stored", async () => {
  expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
});

test("saveSettings merges over defaults", async () => {
  await saveSettings({ cardCount: 4 });
  expect((await loadSettings()).cardCount).toBe(4);
});
