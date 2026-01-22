/* sx.floatlog.js — Floating Runtime Log Panel (Unified) v1.0.2 (Frozen)
   What this fixes:
   - ✅ Single log sink: prefers #log-container, fallback to [data-sx-floatlog-body]
   - ✅ append(line, {autoOpen:true}) supported (so runtime can auto-open)
   - ✅ Close clears pad; Open adds pad
   - ✅ X closes, Collapse animates to right then closes, Handle toggles
*/

(function(){
  "use strict";

  const STORE_KEY = "sx.floatlog.open"; // "1" or "0"

  function qs(root, sel){ return root ? root.querySelector(sel) : null; }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function boot(){
    const panel = document.getElementById("audit-drawer");
    const handle = document.querySelector('[data-sx-floatlog-handle]');

    // safe no-op
    if (!panel || !handle) return false;

    const body = document.body;

    const headTitleMain = qs(panel, "[data-sx-floatlog-title-main]");
    const headTitleSub  = qs(panel, "[data-sx-floatlog-title-sub]");

    // ✅ log sink unification:
    // Prefer #log-container (runtime contract), fallback to floatlog body slot
    const bodyBoxWrap = qs(panel, "[data-sx-floatlog-body]");
    const logSink = qs(panel, "#log-container") || bodyBoxWrap;

    const btnClose    = qs(panel, "[data-sx-floatlog-close]");
    const btnCollapse = qs(panel, "[data-sx-floatlog-collapse]");

    let isOpen = false;

    // touch swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let touching = false;

    // --------------------
    // Layout: prevent cover (OPEN only)
    // --------------------
    function applyPad(open){
      if (open){
        body.classList.add("sx-floatlog-pad");

        const bottomCss = getComputedStyle(document.documentElement)
          .getPropertyValue("--sx-floatlog-bottom")
          .trim();

        const bottom = Number.parseInt(bottomCss || "86", 10) || 86;
        const pad = clamp(bottom + 80, 120, 220);

        document.documentElement.style.setProperty("--sx-floatlog-pad-bottom", pad + "px");
      }else{
        body.classList.remove("sx-floatlog-pad");
        document.documentElement.style.setProperty("--sx-floatlog-pad-bottom", "0px");
      }
    }

    function setOpenState(next){
      isOpen = !!next;
      try { localStorage.setItem(STORE_KEY, isOpen ? "1" : "0"); } catch(_){}

      if (isOpen){
        panel.hidden = false;
        panel.classList.remove("is-collapsing");
        handle.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
      }else{
        panel.classList.remove("is-collapsing");
        panel.hidden = true;
        handle.setAttribute("aria-expanded", "false");
        panel.setAttribute("aria-hidden", "true");
      }

      applyPad(isOpen);
    }

    function open(){ setOpenState(true); }
    function close(){ setOpenState(false); }
    function toggle(){ isOpen ? close() : open(); }

    function collapseAnimated(){
      if (!isOpen) return;
      panel.classList.add("is-collapsing");
      window.setTimeout(() => close(), 180);
    }

    // --------------------
    // Rendering lines
    // --------------------
    function normalizeLine(x){
      // Accept:
      // - string
      // - { mark?:">", text:"...", muted?:true }
      if (typeof x === "string"){
        return { mark: ">", text: x, muted: false };
      }
      if (x && typeof x === "object"){
        const mark = typeof x.mark === "string" ? x.mark : ">";
        const text = typeof x.text === "string" ? x.text : JSON.stringify(x);
        const muted = !!x.muted;
        return { mark, text, muted };
      }
      return { mark: ">", text: String(x), muted: false };
    }

    function renderLineEl(line){
      const row = document.createElement("div");
      row.className = "sx-floatlog-line" + (line.muted ? " is-muted" : "");

      const mark = document.createElement("span");
      mark.className = "sx-floatlog-mark";
      mark.textContent = line.mark;

      const text = document.createElement("span");
      text.className = "sx-floatlog-text";
      text.textContent = line.text;

      row.appendChild(mark);
      row.appendChild(text);
      return row;
    }

    function scrollToBottom(){
      try{
        if (!logSink) return;
        logSink.scrollTop = logSink.scrollHeight;
      }catch(_){}
    }

    function renderLines(lines){
      if (!logSink) return;
      logSink.innerHTML = "";

      const arr = Array.isArray(lines) ? lines : [];
      for (const item of arr){
        const line = normalizeLine(item);
        logSink.appendChild(renderLineEl(line));
      }

      scrollToBottom();
    }

    // ✅ append supports opts.autoOpen
    function append(line, opts){
      if (!logSink) return;

      const nl = normalizeLine(line);
      logSink.appendChild(renderLineEl(nl));
      scrollToBottom();

      if (opts && opts.autoOpen && !isOpen) open();
    }

    function clear(){
      if (!logSink) return;
      logSink.innerHTML = "";
    }

    function setTitle(main, sub){
      if (headTitleMain) headTitleMain.textContent = main || "RUNTIME";
      if (headTitleSub)  headTitleSub.textContent  = sub || "";
    }

    // --------------------
    // Events
    // --------------------
    handle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    if (btnClose){
      btnClose.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      });
    }

    if (btnCollapse){
      btnCollapse.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        collapseAnimated();
      });
    }

    // touch swipe right on panel
    panel.addEventListener("touchstart", (e) => {
      if (!isOpen) return;
      if (!e.touches || !e.touches[0]) return;
      touching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    panel.addEventListener("touchmove", (e) => {
      if (!isOpen || !touching) return;
      if (!e.touches || !e.touches[0]) return;

      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      if (Math.abs(dy) > Math.abs(dx)) return;

      if (dx > 18){
        e.preventDefault();
      }
    }, { passive: false });

    panel.addEventListener("touchend", (e) => {
      if (!isOpen || !touching) return;
      touching = false;

      const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
      if (!t) return;

      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      if (dx > 70 && Math.abs(dy) < 60){
        collapseAnimated();
      }
    }, { passive: true });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });

    // Restore open state
    let saved = "0";
    try { saved = localStorage.getItem(STORE_KEY) || "0"; } catch(_){}
    setOpenState(saved === "1");

    // --------------------
    // Public API
    // --------------------
    window.SXFloatLog = {
      open,
      close,
      toggle,
      setTitle,
      setLines(lines, opts){
        renderLines(lines);
        if (opts && opts.autoOpen) open();
      },
      append,   // append(line, {autoOpen?:true})
      clear,
      isOpen(){ return isOpen; }
    };

    return true;
  }

  if (!boot()){
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
