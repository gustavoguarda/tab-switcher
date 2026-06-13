// Tab Switcher — content modal.
// Declared in the manifest, so it runs on every http/https page at
// document_start: the keyboard listener is ALWAYS ready (no inject race), and
// the UI lives in a Shadow DOM styled with a constructable stylesheet, so the
// page's CSS and the page's CSP can't affect it.
(function () {
  function nextIndex(i, len) { return len ? (i + 1) % len : 0; }
  function prevIndex(i, len) { return len ? (i - 1 + len) % len : 0; }

  var AUTO_CANCEL_MS = 5000;

  var CSS = `
:host { all: initial; }
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
}
.backdrop.hidden { display: none; }
.panel {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
  background: #1c1c20;
  border-radius: 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55), 0 4px 16px rgba(0, 0, 0, 0.4);
  font: 14px -apple-system, "Segoe UI", system-ui, sans-serif;
  color: #eaeaea;
}
.card {
  width: 216px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 9px;
  padding: 8px;
  border-radius: 14px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  overflow: hidden;
  box-sizing: border-box;
}
.card.selected {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(255, 255, 255, 0.16);
}
.fallicon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}
.title {
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #eaeaea;
}
.card.has-thumb { justify-content: flex-start; }
.thumb {
  display: block;
  width: 100%;
  height: 132px;
  object-fit: cover;
  object-position: top center;
  border-radius: 9px;
  flex-shrink: 0;
}
.meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 0 2px 2px;
  box-sizing: border-box;
  overflow: hidden;
}
.fav {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}
.meta .title {
  flex: 1;
  text-align: left;
  font-weight: 600;
  color: #f2f2f2;
}
`;

  var host = null;
  var shadow = null;
  var backdrop = null;
  var panel = null;
  var cards = [];
  var selected = 0;
  var visible = false;
  var timer = null;

  function build() {
    var stale = document.getElementById("control-tab-host");
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
    host = document.createElement("div");
    host.id = "control-tab-host";
    shadow = host.attachShadow({ mode: "open" });
    try {
      var sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS);
      shadow.adoptedStyleSheets = [sheet];
    } catch (e) {
      var styleEl = document.createElement("style");
      styleEl.textContent = CSS;
      shadow.appendChild(styleEl);
    }
    backdrop = document.createElement("div");
    backdrop.className = "backdrop hidden";
    panel = document.createElement("div");
    panel.className = "panel";
    backdrop.appendChild(panel);
    shadow.appendChild(backdrop);
    backdrop.addEventListener("mousedown", function (e) {
      if (e.target === backdrop) commitCancel(); // click on the dim area cancels
    });
    var parent = document.documentElement || document.body || document;
    parent.appendChild(host);
  }

  function ensureHost() {
    if (!host || !host.isConnected) build();
  }

  function renderCards() {
    panel.textContent = "";
    for (var i = 0; i < cards.length; i++) {
      (function (index) {
        var card = cards[index];
        var el = document.createElement("div");
        el.className = "card" + (index === selected ? " selected" : "");
        if (card.thumbnail) {
          el.className += " has-thumb";
          var thumb = document.createElement("img");
          thumb.className = "thumb";
          thumb.src = card.thumbnail;
          thumb.onerror = function () { thumb.style.display = "none"; };
          var meta = document.createElement("div");
          meta.className = "meta";
          var fav = document.createElement("img");
          fav.className = "fav";
          fav.src = card.favIconUrl || "";
          fav.onerror = function () { fav.style.display = "none"; };
          var title = document.createElement("div");
          title.className = "title";
          title.textContent = card.title;
          meta.appendChild(fav);
          meta.appendChild(title);
          el.appendChild(thumb);
          el.appendChild(meta);
        } else {
          var icon = document.createElement("img");
          icon.className = "fallicon";
          icon.src = card.favIconUrl || "";
          icon.onerror = function () { icon.style.visibility = "hidden"; };
          var t2 = document.createElement("div");
          t2.className = "title";
          t2.textContent = card.title;
          el.appendChild(icon);
          el.appendChild(t2);
        }
        el.addEventListener("click", function () { commitSelect(index); });
        panel.appendChild(el);
      })(i);
    }
  }

  function highlight() {
    var els = panel.querySelectorAll(".card");
    for (var i = 0; i < els.length; i++) {
      if (i === selected) els[i].classList.add("selected");
      else els[i].classList.remove("selected");
    }
  }

  function armTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(function () { if (visible) commitCancel(); }, AUTO_CANCEL_MS);
  }

  function showModal() {
    ensureHost();
    backdrop.classList.remove("hidden");
    visible = true;
    armTimer();
  }

  function hideModal() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
    if (backdrop) backdrop.classList.add("hidden");
    visible = false;
  }

  function send(msg) {
    try {
      var p = chrome.runtime.sendMessage(msg);
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {
      // service worker / context unavailable — modal is already hidden
    }
  }

  function commitSelect(i) {
    hideModal();
    if (cards[i]) send({ type: "select", tabId: cards[i].id });
  }

  function commitCancel() {
    hideModal();
    send({ type: "cancel" });
  }

  function onMessage(msg, sender, sendResponse) {
    if (!msg || !msg.type) return;

    if (msg.type === "show") {
      ensureHost();
      cards = msg.cards || [];
      selected = typeof msg.startIndex === "number" ? msg.startIndex : 1;
      if (selected >= cards.length) selected = cards.length - 1;
      if (selected < 0) selected = 0;
      renderCards();
      showModal();
      return;
    }

    if (msg.type === "advance") {
      if (!visible) {
        // Background thinks we're open but we're hidden (stale state). Tell it
        // so it clears state and opens fresh — the press isn't wasted.
        sendResponse({ stale: true });
        return;
      }
      selected = msg.dir > 0
        ? nextIndex(selected, cards.length)
        : prevIndex(selected, cards.length);
      highlight();
      armTimer();
      return;
    }

    if (msg.type === "remove" && typeof msg.tabId === "number") {
      if (!visible) return;
      var idx = -1;
      for (var k = 0; k < cards.length; k++) {
        if (cards[k].id === msg.tabId) { idx = k; break; }
      }
      if (idx === -1) return;
      cards.splice(idx, 1);
      if (cards.length === 0) { commitCancel(); return; }
      if (idx < selected) selected -= 1;
      if (selected >= cards.length) selected = cards.length - 1;
      if (selected < 0) selected = 0;
      renderCards();
      armTimer();
      return;
    }

    if (msg.type === "hide") { hideModal(); return; }
  }

  function onKeyDown(e) {
    if (!visible) return;
    if (e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      selected = e.shiftKey
        ? prevIndex(selected, cards.length)
        : nextIndex(selected, cards.length);
      highlight();
      armTimer();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      selected = nextIndex(selected, cards.length);
      highlight();
      armTimer();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      selected = prevIndex(selected, cards.length);
      highlight();
      armTimer();
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      commitSelect(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      commitCancel();
    }
  }

  function onKeyUp(e) {
    if (!visible) return;
    if (e.key === "Alt" || e.key === "Meta" || e.key === "Control") {
      commitSelect(selected);
    }
  }

  // (Re)register listeners. The script runs again only when there is no live
  // listener (declarative inject once per page load, or an on-demand re-inject
  // after the extension reloaded and the old context died). Tear down any
  // previous registration first so re-injection is clean and never duplicates.
  if (typeof window.__ctTeardown === "function") {
    try { window.__ctTeardown(); } catch (e) { /* old context already dead */ }
  }
  chrome.runtime.onMessage.addListener(onMessage);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  window.__ctTeardown = function () {
    try { chrome.runtime.onMessage.removeListener(onMessage); } catch (e) {}
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("keyup", onKeyUp, true);
    var h = document.getElementById("control-tab-host");
    if (h && h.parentNode) h.parentNode.removeChild(h);
  };
})();
