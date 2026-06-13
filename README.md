# Tab Switcher

An MRU (most-recently-used) tab switcher for Microsoft Edge and Google Chrome,
inspired by Arc/Zen's `Ctrl+Tab`. Hold the shortcut modifier and tap to cycle
through your recent tabs as a centered row of cards; release to switch. A quick
tap toggles the two most recent tabs.

## Install (load unpacked)

1. Open `edge://extensions` (or `chrome://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Accept the **"read and change all your data on all websites"** prompt — a tab
   switcher has to draw its overlay on every page (see [Permissions](#permissions)).

## How it works

- **`Cmd+E`** (macOS) / **`Alt+Q`** (Windows/Linux) — opens the switcher, and
  while it's open each additional press **advances forward**.
- **Cycle back** (no default key — see below) — opens preselecting the last card,
  and while open **advances backward**.
- **Release the held modifier** (`Cmd` / `Alt`) to switch to the selected tab.
- `Tab` / `Shift+Tab` and the arrow keys also move the selection; **`Esc`**
  cancels; **clicking** a card (or the dim backdrop) commits/cancels.

The MRU order is per window. The number of cards is configurable (4–9, default 6)
on the **Options** page, where you can also turn on tab **previews**.

### On internal pages

The overlay is drawn inside the page, so it can't appear on pages where content
scripts don't run (`edge://*`, the New Tab page, the web store, the PDF viewer,
error pages). Pressing the shortcut there **switches to your most-recent web tab
and opens the switcher on it**, so you can still cycle; if no web tab is open it
just jumps to your previous tab.

## Shortcuts

Defaults:

- **Open / cycle forward** — macOS `Cmd+E`, Windows/Linux `Alt+Q`.
- **Cycle back** — *no default* (the natural `Cmd+Shift+E` is reserved by Edge's
  sidebar). Assign your own key at `edge://extensions/shortcuts`.

### Forcing `Cmd+Shift+E` for "cycle back"

Edge reserves `Cmd+Shift+E` (Bing/Copilot sidebar), so it can't be set through
the normal shortcuts UI — but it can be **forced**, and the extension's binding
then takes priority. The **Options page** generates a ready-to-paste snippet with
your extension id already filled in. Copy it, then:

1. Open `edge://extensions` with **Developer mode** on.
2. Open DevTools on that page (`Cmd+Opt+I`) → **Console**.
3. Paste and press Enter. It looks like:

   ```js
   chrome.developerPrivate.updateExtensionCommand({
     extensionId: "YOUR_EXTENSION_ID",
     commandName: "cycle-back",
     keybinding: "Command+Shift+E"
   });
   ```

This is per-install and may reset on browser/extension updates (just run it
again). Reverse it any time at `edge://extensions/shortcuts`. The same technique
can force the literal `Ctrl+Tab` onto `open-switcher` (`keybinding: "Ctrl+Tab"`),
which disables the browser's native Ctrl+Tab cycling.

## Tab previews (optional)

Off by default. Turn on **Tab previews** in Options to show a screenshot of each
tab on its card (like Arc's switcher). Because MV3 can only screenshot the
*visible* tab, previews are **cached as you visit each tab** — not live — and
don't exist for internal pages (those fall back to the favicon). Captures are
downscaled JPEGs kept in session storage (most recent ~12 tabs); turning the
toggle off clears the cache.

## Languages

The extension follows the **browser's UI language** via Chrome's i18n. It ships
with **English** (default) and **Brazilian Portuguese** (`pt_BR`); any other UI
language falls back to English. The switcher itself has no static text — it shows
each tab's own title — so only the manifest and the Options page are translated.
Add a language by creating `_locales/<lang>/messages.json` with the same keys.

## Permissions

- `tabs`, `storage` — read tab title/favicon, track MRU, store settings.
- `scripting` + `host_permissions: ["<all_urls>"]` — the modal is a content
  script present on every web page so its keyboard listener is always ready (this
  is what makes the hold/release reliable), and it can be injected on demand into
  tabs opened before the extension loaded. The same host access lets the previews
  feature capture screenshots.

## Architecture

- **`src/background.js`** — service worker. Tracks the per-window MRU
  (`chrome.storage.session`), handles the two commands, builds the cards,
  messages the modal, commits the switch, and (when previews are on) captures tab
  screenshots. Pure ordering/selection logic lives in unit-tested modules.
- **`src/content/modal.js`** — the overlay, a **declared content script** on
  http/https pages. Renders in a **Shadow DOM** with a **constructable
  stylesheet**, so the page's CSS and CSP can't affect it. Re-registers cleanly if
  re-injected after an extension reload. No static strings.
- **`src/mru.js`, `src/overlay-data.js`, `src/storage.js`** — pure helpers with
  unit tests (`test/*.test.js`).
- **`src/options/`** — Options page (card count, previews toggle, the override
  snippet generator), localized via `chrome.i18n`.
- **`_locales/`** — `en` (default) and `pt_BR` message catalogs.
- **`icons/`** + **`scripts/gen-icon.mjs`** — the icon (a row of tab cards with
  the middle one selected) is generated by the script in 16/48/128 px; tweak the
  `layers` array and re-run `node scripts/gen-icon.mjs`.

There is **no popup window** — on pages that can host it, the switcher is an
in-page modal; elsewhere it switches to a web tab and shows the modal there.

## Development

```bash
npm install
npm test
```

The MRU ordering, card selection, and storage wrappers are unit-tested. The
service worker, content modal, and options page are integration glue, verified
with the manual checklist below.

### Reloading during development

After **reloading the extension**, tabs opened beforehand lose the declared
content script until they reload — but the switcher **injects it on demand**, so
pressing the shortcut still works (the first press on such a tab just re-injects).
A full reinstall is only needed if state gets into a bad shape.

## Manual QA checklist

- Quick tap of `Cmd+E` switches to the previously used tab.
- Holding `Cmd` and tapping `Cmd+E` advances; releasing `Cmd` switches.
- The cycle-back key (once bound/forced) and `Shift+Tab` / arrows move backward.
- `Esc`, a click on a card, or a click on the backdrop all behave correctly.
- The modal looks identical across sites, including CSP-strict ones (e.g. GitHub).
- After switching, pressing `Cmd+E` again reopens reliably.
- Closing a listed tab while the switcher is open removes its card.
- On an `edge://` page the shortcut switches to your most-recent web tab and shows
  the switcher there.
- Previews on: visit a few tabs, then the cards show their screenshots; previews
  off clears them.
- Options and the extension description appear in the browser's language.
- Two windows keep independent recent-tab order.
