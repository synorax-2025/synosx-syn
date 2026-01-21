/* sx.drawer.js — Frozen v1.4.1 (DOM-ready + iOS scroll fix + stable group toggle)
   ✅ Works even if script is not deferred (wait DOM)
   ✅ iOS stable: background locked + allow panel scroll
   ✅ Drawer supports:
      - Use Cases fold (.sx-drawer-usecases -> #sx-usecases-panel)
      - Generic group folds (.sx-drawer-group[aria-controls] -> #sx-group-*)
   ✅ Group panel lookup is SCOPED to drawer (no global getElementById bugs)
*/

(function(){
  "use strict";

  function boot(){
    const btn = document.getElementById("sxMenuBtn");
    const drawer = document.getElementById("sx-mobile-menu");
    if (!btn || !drawer) return false;

    const panel = drawer.querySelector(".sx-drawer-panel");
    const backdrop = drawer.querySelector(".sx-drawer-backdrop");
    const nav = document.querySelector("#navbar") || document.querySelector("nav");

    // Use Cases (special)
    const ucBtn = drawer.querySelector(".sx-drawer-usecases");
    const ucPanel = drawer.querySelector("#sx-usecases-panel");

    // Generic groups (目录等) — cache once
    const groupBtns = Array.from(drawer.querySelectorAll(".sx-drawer-group[aria-controls]"));

    let locked = false;
    let scrollY = 0;

    // iOS: touch control
    let touchStartY = 0;

    function syncNavHeight(){
      if (!nav) return;
      const h = Math.ceil(nav.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--sx-nav-h", h + "px");
    }

    function syncViewportPx(){
      const h = Math.ceil(window.innerHeight || 0);
      if (h > 0) document.documentElement.style.setProperty("--sx-vh-px", h + "px");
    }

    function applyHardFloor(){
      // 兜底：避免变量未写入时“2行高”错觉
      if (!panel) return;
      panel.style.minHeight = "360px"; // 你要“至少 6 个按钮高度”，360 更稳
    }

    function lockBodyFixed(on){
      if (on){
        if (locked) return;
        locked = true;

        scrollY = window.scrollY || window.pageYOffset || 0;

        document.body.style.position = "fixed";
        document.body.style.top = (-scrollY) + "px";
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
      }else{
        if (!locked) return;
        locked = false;

        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";

        window.scrollTo(0, scrollY);
      }
    }

    // ----------------------
    // Use Cases fold
    // ----------------------
    function closeUseCases(){
      if (!ucBtn || !ucPanel) return;
      ucBtn.setAttribute("aria-expanded", "false");
      ucPanel.hidden = true;
    }

    function toggleUseCases(){
      if (!ucBtn || !ucPanel) return;
      const isOpen = ucBtn.getAttribute("aria-expanded") === "true";
      ucBtn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      ucPanel.hidden = isOpen;
    }

    // ----------------------
    // Generic group folds (目录等)
    // ----------------------
    function getGroupPanel(btnEl){
      const id = btnEl && btnEl.getAttribute("aria-controls");
      if (!id) return null;
      // ✅ scope to drawer only — critical fix
      return drawer.querySelector("#" + CSS.escape(id));
    }

    function closeAllGroups(){
      groupBtns.forEach((b) => {
        const p = getGroupPanel(b);
        b.setAttribute("aria-expanded", "false");
        if (p) p.hidden = true;
      });
    }

    function openOnlyThisGroup(btnEl){
      // policy: only one group open at a time (prevents “一坨”)
      groupBtns.forEach((b) => {
        const p = getGroupPanel(b);
        const isSelf = b === btnEl;

        b.setAttribute("aria-expanded", isSelf ? "true" : "false");
        if (p) p.hidden = !isSelf;
      });
    }

    function toggleGroup(btnEl){
      const p = getGroupPanel(btnEl);
      if (!p) return;

      const isOpen = btnEl.getAttribute("aria-expanded") === "true";
      if (isOpen){
        btnEl.setAttribute("aria-expanded", "false");
        p.hidden = true;
      }else{
        openOnlyThisGroup(btnEl);
      }
    }

    // ----------------------
    // iOS scroll fix
    // ----------------------
    function onDrawerTouchMove(e){ e.preventDefault(); }

    function onPanelTouchStart(e){
      touchStartY = e.touches ? e.touches[0].clientY : 0;
    }

    function onPanelTouchMove(e){
      if (!panel) return;

      const curY = e.touches ? e.touches[0].clientY : 0;
      const deltaY = curY - touchStartY;

      const atTop = panel.scrollTop <= 0;
      const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)){
        e.preventDefault();
        return;
      }
      e.stopPropagation();
    }

    function enableIosScrollFix(){
      drawer.addEventListener("touchmove", onDrawerTouchMove, { passive: false });
      if (panel){
        panel.addEventListener("touchstart", onPanelTouchStart, { passive: true });
        panel.addEventListener("touchmove", onPanelTouchMove, { passive: false });
      }
    }

    function disableIosScrollFix(){
      drawer.removeEventListener("touchmove", onDrawerTouchMove);
      if (panel){
        panel.removeEventListener("touchstart", onPanelTouchStart);
        panel.removeEventListener("touchmove", onPanelTouchMove);
      }
    }

    // ----------------------
    // Open / Close
    // ----------------------
    function open(){
      syncNavHeight();
      syncViewportPx();
      applyHardFloor();

      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");

      closeUseCases();
      closeAllGroups();

      lockBodyFixed(true);
      enableIosScrollFix();

      setTimeout(() => { try{ panel && panel.focus(); }catch(_){} }, 0);
    }

    function close(){
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");

      disableIosScrollFix();
      lockBodyFixed(false);

      closeUseCases();
      closeAllGroups();

      try{ btn.focus(); }catch(_){}
    }

    // ----------------------
    // Events
    // ----------------------
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      drawer.classList.contains("is-open") ? close() : open();
    });

    if (backdrop) backdrop.addEventListener("click", close);

    // close-on-click (links + any [data-close])
    drawer.addEventListener("click", (e) => {
      const el = e.target && e.target.closest && e.target.closest('[data-close="sx-drawer"]');
      if (el) close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
    });

    // Use Cases fold
    if (ucBtn && ucPanel){
      closeUseCases();
      ucBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleUseCases();
      });
    }

    // Group fold (event delegation)
    drawer.addEventListener("click", (e) => {
      const gbtn = e.target && e.target.closest && e.target.closest(".sx-drawer-group[aria-controls]");
      if (!gbtn) return;
      e.preventDefault();
      e.stopPropagation();
      toggleGroup(gbtn);
    });

    function onViewportChange(){
      if (!drawer.classList.contains("is-open")) return;
      syncViewportPx();
      syncNavHeight();
      applyHardFloor();
    }

    window.addEventListener("resize", onViewportChange);
    if (window.visualViewport){
      window.visualViewport.addEventListener("resize", onViewportChange);
    }

    // init vars even before open
    syncNavHeight();
    syncViewportPx();
    applyHardFloor();

    return true;
  }

  // ✅ if script runs too early, wait DOM ready
  if (!boot()){
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
