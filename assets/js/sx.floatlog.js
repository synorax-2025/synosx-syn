/* sx.floatlog.js — FloatLog Console (Scheme B) — FIXED
   - Fix: buttons inside handle should still click (do not start drag when target is [data-action])
   - window.SXFloatLog API:
       open(), close(), toggle()
       collapse(), expand(), toggleCollapse()
       clear(), append({mark,text,muted}), hr()
       setTitle(text), setDot(on)
       resetPosition()
*/

(function SXFloatLogBundle(){
  const KEY_POS = "sx.floatlog.pos.v1";
  const KEY_STATE = "sx.floatlog.state.v1"; // collapsed, hidden

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function readJsonSafe(key){
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch { return null; }
  }
  function writeJsonSafe(key, val){
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  function ensureRoot(){
    let root = document.querySelector(".sx-floatlog");
    if (root) return root;

    // Create minimal DOM if missing
    root = document.createElement("div");
    root.className = "sx-floatlog";
    root.innerHTML = `
      <div class="sx-floatlog__panel">
        <div class="sx-floatlog__handle">
          <span class="sx-floatlog__title">
            <i class="sx-floatlog__dot" aria-hidden="true"></i>
            <span class="sx-floatlog__titleText">AUDIT ENGINE</span>
          </span>
          <div class="sx-floatlog__actions">
            <button class="sx-floatlog__btn" type="button" data-action="collapse" title="Collapse">—</button>
            <button class="sx-floatlog__btn" type="button" data-action="close" title="Close">×</button>
          </div>
        </div>
        <div class="sx-floatlog__body" aria-live="polite"></div>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  function getParts(root){
    return {
      panel: root.querySelector(".sx-floatlog__panel"),
      handle: root.querySelector(".sx-floatlog__handle"),
      body: root.querySelector(".sx-floatlog__body"),
      titleText: root.querySelector(".sx-floatlog__titleText"),
      dot: root.querySelector(".sx-floatlog__dot"),
    };
  }

  function applyState(root){
    const st = readJsonSafe(KEY_STATE) || {};
    if (st.hidden) root.classList.add("is-hidden");
    else root.classList.remove("is-hidden");

    if (st.collapsed) root.classList.add("is-collapsed");
    else root.classList.remove("is-collapsed");
  }

  function saveState(root){
    writeJsonSafe(KEY_STATE, {
      hidden: root.classList.contains("is-hidden"),
      collapsed: root.classList.contains("is-collapsed"),
    });
  }

  function restorePos(root){
    const pos = readJsonSafe(KEY_POS);
    if (!pos || !Number.isFinite(pos.left) || !Number.isFinite(pos.top)) return;

    root.dataset.mode = "free";
    root.style.left = pos.left + "px";
    root.style.top  = pos.top + "px";
  }

  function savePosFromRect(root){
    const rect = root.getBoundingClientRect();
    writeJsonSafe(KEY_POS, { left: Math.round(rect.left), top: Math.round(rect.top) });
  }

  function clampIntoViewport(root){
    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = clamp(rect.left, 8, vw - rect.width - 8);
    const top  = clamp(rect.top, 8, vh - rect.height - 8);

    root.dataset.mode = "free";
    root.style.left = Math.round(left) + "px";
    root.style.top  = Math.round(top) + "px";
    savePosFromRect(root);
  }

  function initDraggable(root){
    const { handle } = getParts(root);
    if (!handle) return;

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    let pid = null;

    function isOnActionButton(target){
      return !!(target && target.closest && target.closest("[data-action]"));
    }

    function onDown(e){
      // ✅ FIX: clicking collapse/close should NOT start drag
      if (isOnActionButton(e.target)) return;

      // Only allow left-click / touch
      if (e.button != null && e.button !== 0) return;

      dragging = true;
      pid = e.pointerId;

      root.classList.add("is-dragging");

      const rect = root.getBoundingClientRect();
      startLeft = rect.left;
      startTop  = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      // Switch to free mode
      root.dataset.mode = "free";
      root.style.left = startLeft + "px";
      root.style.top  = startTop + "px";

      try { handle.setPointerCapture(pid); } catch {}

      // prevent text selection / scroll
      e.preventDefault();
    }

    function onMove(e){
      if (!dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const rect = root.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const newLeft = clamp(startLeft + dx, 8, vw - rect.width - 8);
      const newTop  = clamp(startTop  + dy, 8, vh - rect.height - 8);

      root.style.left = newLeft + "px";
      root.style.top  = newTop + "px";
    }

    function onUp(){
      if (!dragging) return;
      dragging = false;
      root.classList.remove("is-dragging");

      savePosFromRect(root);

      try { handle.releasePointerCapture(pid); } catch {}
      pid = null;
    }

    handle.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    window.addEventListener("resize", () => {
      const pos = readJsonSafe(KEY_POS);
      if (pos) clampIntoViewport(root);
    });
  }

  function initActions(root){
    // Use CAPTURE at document level to avoid any other preventDefault/stopPropagation surprises
    function onClick(e){
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const host = btn.closest(".sx-floatlog");
      if (!host) return;

      if (action === "close") {
        host.classList.add("is-hidden");
        saveState(host);
        return;
      }
      if (action === "collapse") {
        host.classList.toggle("is-collapsed");
        saveState(host);
        return;
      }
    }

    // Bind once
    if (!document.documentElement.dataset.sxFloatlogClickBound){
      document.documentElement.dataset.sxFloatlogClickBound = "1";
      document.addEventListener("click", onClick, true);
    }
  }

  function scrollToBottom(body){
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  function mkLine({ mark=">", text="", muted=false }){
    const line = document.createElement("div");
    line.className = "sx-floatlog__line" + (muted ? " is-muted" : "");
    line.innerHTML = `
      <span class="sx-floatlog__mark">${escapeHtml(mark)}</span>
      <span class="sx-floatlog__text">${escapeHtml(text)}</span>
    `;
    return line;
  }

  function mkHr(){
    const hr = document.createElement("div");
    hr.className = "sx-floatlog__hr";
    return hr;
  }

  // ---------- Public API ----------
  const api = {
    ensure(){
      const root = ensureRoot();
      const parts = getParts(root);

      applyState(root);
      restorePos(root);

      if (!root.dataset.inited){
        root.dataset.inited = "1";
        initDraggable(root);
        initActions(root);

        const pos = readJsonSafe(KEY_POS);
        if (pos) clampIntoViewport(root);
      }
      return { root, parts };
    },

    open(){
      const { root } = this.ensure();
      root.classList.remove("is-hidden");
      saveState(root);
      return this;
    },

    close(){
      const { root } = this.ensure();
      root.classList.add("is-hidden");
      saveState(root);
      return this;
    },

    toggle(){
      const { root } = this.ensure();
      root.classList.toggle("is-hidden");
      saveState(root);
      return this;
    },

    collapse(){
      const { root } = this.ensure();
      root.classList.add("is-collapsed");
      saveState(root);
      return this;
    },

    expand(){
      const { root } = this.ensure();
      root.classList.remove("is-collapsed");
      saveState(root);
      return this;
    },

    toggleCollapse(){
      const { root } = this.ensure();
      root.classList.toggle("is-collapsed");
      saveState(root);
      return this;
    },

    clear(){
      const { parts } = this.ensure();
      if (parts.body) parts.body.innerHTML = "";
      return this;
    },

    hr(){
      const { parts } = this.ensure();
      if (!parts.body) return this;
      parts.body.appendChild(mkHr());
      return this;
    },

    append(entry){
      const { root, parts } = this.ensure();

      // auto-open for your "default floating window" behavior
      root.classList.remove("is-hidden");
      saveState(root);

      if (!parts.body) return this;

      // strict: expects object with {mark,text,muted}
      const e = entry || {};
      parts.body.appendChild(mkLine({
        mark: e.mark ?? ">",
        text: e.text ?? "",
        muted: !!e.muted
      }));

      scrollToBottom(parts.body);
      return this;
    },

    setTitle(text){
      const { parts } = this.ensure();
      if (parts.titleText) parts.titleText.textContent = String(text ?? "");
      return this;
    },

    setDot(on){
      const { parts } = this.ensure();
      if (!parts.dot) return this;
      parts.dot.style.opacity = on ? "0.9" : "0.15";
      return this;
    },

    resetPosition(){
      const { root } = this.ensure();
      root.dataset.mode = "";
      root.style.left = "";
      root.style.top = "";
      try { localStorage.removeItem(KEY_POS); } catch {}
      return this;
    }
  };

  window.SXFloatLog = window.SXFloatLog || api;

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => api.ensure());
  } else {
    api.ensure();
  }
})();
