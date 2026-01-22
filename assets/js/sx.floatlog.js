/* sx.floatlog.js — FloatLog Console (Scheme B + Edge Dock v2 + Snap Animation)
   - States:
       OPEN        : normal (body visible)
       COLLAPSED   : mini bar (body hidden) via "—"
       DOCKED      : edge handle (auto when near edge; forces COLLAPSED)
   - Behaviors:
       - draggable by .sx-floatlog__handle (buttons still clickable)
       - auto-dock when dragged near viewport edge (no need to press "—")
       - snap animation (120ms ease-out) on dock
       - click handle while DOCKED -> undock + expand (back to OPEN)
       - close (×) hides panel; append/open will auto-show again
   - Storage:
       - position persisted (left/top) in localStorage ONLY for free mode
       - state persisted (hidden/collapsed) in localStorage
       - dock state NOT persisted (intentional: transient UX)
   - Public API: window.SXFloatLog
       open(), close(), toggle()
       collapse(), expand(), toggleCollapse()
       clear(), append({mark,text,muted}|string), hr()
       setTitle(text), setDot(on)
       resetPosition()
*/

(function SXFloatLogBundle(){
  "use strict";

  const KEY_POS   = "sx.floatlog.pos.v1";
  const KEY_STATE = "sx.floatlog.state.v1";

  const EDGE_THRESHOLD = 40;   // 吸附阈值（像系统磁吸）
  const EDGE_PAD = 2;          // 允许贴边到 2px（左边吸附关键）
  const SNAP_MS  = 120;        // 吸附动画时长

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

    // Minimal DOM if user didn't place HTML
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
      handle: root.querySelector(".sx-floatlog__handle"),
      body: root.querySelector(".sx-floatlog__body"),
      titleText: root.querySelector(".sx-floatlog__titleText"),
      dot: root.querySelector(".sx-floatlog__dot"),
    };
  }

  function applyState(root){
    const st = readJsonSafe(KEY_STATE) || {};
    root.classList.toggle("is-hidden", !!st.hidden);
    root.classList.toggle("is-collapsed", !!st.collapsed);
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
    root.style.top  = pos.top  + "px";
  }

  function savePosFromRect(root){
    const rect = root.getBoundingClientRect();
    writeJsonSafe(KEY_POS, { left: Math.round(rect.left), top: Math.round(rect.top) });
  }

  function clampIntoViewport(root){
    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = clamp(rect.left, EDGE_PAD, vw - rect.width - EDGE_PAD);
    const top  = clamp(rect.top,  EDGE_PAD, vh - rect.height - EDGE_PAD);

    root.dataset.mode = "free";
    root.style.left = Math.round(left) + "px";
    root.style.top  = Math.round(top)  + "px";
    savePosFromRect(root);
  }

  // -----------------------------
  // Dock helpers (Edge Snap)
  // -----------------------------
  function getDockSideFromPointer(x, y, thresholdPx){
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const dLeft = x;
    const dRight = vw - x;
    const dTop = y;
    const dBottom = vh - y;

    const min = Math.min(dLeft, dRight, dTop, dBottom);
    if (min > thresholdPx) return null;

    if (min === dLeft) return "left";
    if (min === dRight) return "right";
    if (min === dTop) return "top";
    return "bottom";
  }

  function withSnapTransition(root, fn){
    // 只在吸附瞬间加 transition，不污染拖拽
    const prev = root.style.transition;
    root.style.transition = `left ${SNAP_MS}ms ease-out, top ${SNAP_MS}ms ease-out`;
    try { fn(); } finally {
      // 下一帧移除 transition（避免后续拖动“橡皮筋”）
      requestAnimationFrame(() => { root.style.transition = prev || ""; });
    }
  }

  function snapDock(root, side){
    // ✅ 贴边即吸附：吸附时强制变把手（collapsed）
    root.classList.add("is-collapsed");
    root.classList.add("is-docked");
    root.dataset.dock = side;

    // 让 CSS（docked 宽度收窄）生效后再算 rect
    root.offsetHeight;

    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left;
    let top  = rect.top;

    if (side === "left")   left = EDGE_PAD;
    if (side === "right")  left = vw - rect.width - EDGE_PAD;
    if (side === "top")    top  = EDGE_PAD;
    if (side === "bottom") top  = vh - rect.height - EDGE_PAD;

    left = clamp(left, EDGE_PAD, vw - rect.width - EDGE_PAD);
    top  = clamp(top,  EDGE_PAD, vh - rect.height - EDGE_PAD);

    root.dataset.mode = "free";

    withSnapTransition(root, () => {
      root.style.left = Math.round(left) + "px";
      root.style.top  = Math.round(top)  + "px";
    });

    // dock 是瞬态：不写 KEY_POS（避免 transform/rect 造成下次偏移）
    saveState(root);
  }

  function undock(root){
    if (!root.classList.contains("is-docked")) return;
    root.classList.remove("is-docked");
    delete root.dataset.dock;
  }

  // -----------------------------
  // Draggable
  // -----------------------------
  function initDraggable(root){
    const { handle } = getParts(root);
    if (!handle) return;

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    let pid = null;

    let lastClientX = 0;
    let lastClientY = 0;

    function isOnActionButton(target){
      return !!(target && target.closest && target.closest("[data-action]"));
    }

    function onDown(e){
      // ✅ buttons inside handle must remain clickable
      if (isOnActionButton(e.target)) return;

      // Only allow left click / touch
      if (e.button != null && e.button !== 0) return;

      dragging = true;
      pid = e.pointerId;

      // start dragging -> undock (so it becomes free)
      undock(root);

      root.classList.add("is-dragging");

      const rect = root.getBoundingClientRect();
      startLeft = rect.left;
      startTop  = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      lastClientX = e.clientX;
      lastClientY = e.clientY;

      root.dataset.mode = "free";
      root.style.left = startLeft + "px";
      root.style.top  = startTop  + "px";

      try { handle.setPointerCapture(pid); } catch {}
      e.preventDefault();
    }

    function onMove(e){
      if (!dragging) return;

      lastClientX = e.clientX;
      lastClientY = e.clientY;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const rect = root.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // ✅ 允许贴边（EDGE_PAD），左侧也能“吸进去”
      const newLeft = clamp(startLeft + dx, EDGE_PAD, vw - rect.width - EDGE_PAD);
      const newTop  = clamp(startTop  + dy, EDGE_PAD, vh - rect.height - EDGE_PAD);

      root.style.left = newLeft + "px";
      root.style.top  = newTop  + "px";
    }

    function onUp(){
      if (!dragging) return;
      dragging = false;
      root.classList.remove("is-dragging");

      // ✅ 用 pointer 坐标判断吸附边（不受 rect 宽度/布局干扰）
      const side = getDockSideFromPointer(lastClientX, lastClientY, EDGE_THRESHOLD);

      if (side){
        snapDock(root, side);
        // dock 不保存 pos
      } else {
        savePosFromRect(root);
      }

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

  // -----------------------------
  // Actions
  // -----------------------------
  function initActions(){
    function onClick(e){
      const root = e.target.closest(".sx-floatlog");
      if (!root) return;

      const onHandle = e.target.closest(".sx-floatlog__handle");
      const btn = e.target.closest("[data-action]");

      // DOCKED: click handle -> undock + expand
      if (root.classList.contains("is-docked") && onHandle && !btn){
        undock(root);
        root.classList.remove("is-collapsed");
        root.classList.remove("is-hidden");
        saveState(root);
        return;
      }

      if (!btn) return;
      const action = btn.dataset.action;

      if (action === "close"){
        undock(root);
        root.classList.add("is-hidden");
        saveState(root);
        return;
      }

      if (action === "collapse"){
        root.classList.toggle("is-collapsed");
        if (!root.classList.contains("is-collapsed")) undock(root);
        saveState(root);
        return;
      }
    }

    if (!document.documentElement.dataset.sxFloatlogClickBound){
      document.documentElement.dataset.sxFloatlogClickBound = "1";
      document.addEventListener("click", onClick, true);
    }
  }

  // -----------------------------
  // Rendering helpers
  // -----------------------------
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

  // -----------------------------
  // Public API
  // -----------------------------
  const api = {
    ensure(){
      const root = ensureRoot();
      const parts = getParts(root);

      applyState(root);
      restorePos(root);

      if (!root.dataset.inited){
        root.dataset.inited = "1";
        initDraggable(root);
        initActions();

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
      undock(root);
      root.classList.add("is-hidden");
      saveState(root);
      return this;
    },

    toggle(){
      const { root } = this.ensure();
      undock(root);
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
      undock(root);
      root.classList.remove("is-collapsed");
      saveState(root);
      return this;
    },

    toggleCollapse(){
      const { root } = this.ensure();
      root.classList.toggle("is-collapsed");
      if (!root.classList.contains("is-collapsed")) undock(root);
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

      // auto-open
      root.classList.remove("is-hidden");
      saveState(root);

      if (!parts.body) return this;

      // allow string shorthand
      if (typeof entry === "string"){
        parts.body.appendChild(mkLine({ mark: ">", text: entry, muted: false }));
        scrollToBottom(parts.body);
        return this;
      }

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
      undock(root);
      root.dataset.mode = "";
      root.style.left = "";
      root.style.top = "";
      try { localStorage.removeItem(KEY_POS); } catch {}
      return this;
    }
  };

  window.SXFloatLog = window.SXFloatLog || api;

  // Eager init
  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => api.ensure());
  } else {
    api.ensure();
  }
})();
