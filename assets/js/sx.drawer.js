/* sx.drawer.js — Frozen v1.1 (2026-01-19)
   ✅ iOS stable: lock background via body fixed (restores scroll)
   ✅ No vh/dvh: writes --sx-vh-px = window.innerHeight (px)
   ✅ Sync real nav height to --sx-nav-h using #navbar if present
   ✅ Close: backdrop / [data-close="sx-drawer"] / ESC
   ✅ Use Cases is only expandable node
   ✅ iOS viewport changes tracked via visualViewport
*/

(function sxDrawerBoot(){
  "use strict";

  const btn = document.getElementById("sxMenuBtn");
  const drawer = document.getElementById("sx-mobile-menu");
  if (!btn || !drawer) return;

  const panel = drawer.querySelector(".sx-drawer-panel");
  const backdrop = drawer.querySelector(".sx-drawer-backdrop");
  const closeEls = drawer.querySelectorAll('[data-close="sx-drawer"]');

  const nav = document.querySelector("#navbar") || document.querySelector("nav");

  const ucBtn = drawer.querySelector(".sx-drawer-usecases");
  const ucPanel = drawer.querySelector("#sx-usecases-panel");

  let locked = false;
  let scrollY = 0;

  function syncNavHeight(){
    if (!nav) return;
    const h = Math.ceil(nav.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty("--sx-nav-h", h + "px");
  }

  function syncViewportPx(){
    // iOS reliable viewport height source
    const h = Math.ceil(window.innerHeight || 0);
    if (h > 0) document.documentElement.style.setProperty("--sx-vh-px", h + "px");
  }

  function lockBodyFixed(on){
    if (on){
      if (locked) return;
      locked = true;

      scrollY = window.scrollY || window.pageYOffset || 0;

      // iOS-safe scroll lock
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

  function open(){
    syncNavHeight();
    syncViewportPx();

    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");

    // reset scroll position of panel
    try{ if (panel) panel.scrollTop = 0; }catch(_){}

    closeUseCases();
    lockBodyFixed(true);

    // focus panel: helps iOS give scroll ownership to panel
    setTimeout(() => { try{ panel && panel.focus(); }catch(_){} }, 0);
  }

  function close(){
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");

    lockBodyFixed(false);
    closeUseCases();

    try{ btn.focus(); }catch(_){}
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    drawer.classList.contains("is-open") ? close() : open();
  });

  if (backdrop) backdrop.addEventListener("click", close);
  closeEls.forEach(el => el.addEventListener("click", close));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
  });

  if (ucBtn && ucPanel){
    closeUseCases();
    ucBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleUseCases();
    });
  }

  // Update viewport/nav px while open (iOS address bar changes)
  function onViewportChange(){
    if (!drawer.classList.contains("is-open")) return;
    syncViewportPx();
    syncNavHeight();
  }

  window.addEventListener("resize", onViewportChange);

  // iOS: visualViewport is more reliable than window resize for address-bar changes
  if (window.visualViewport){
    window.visualViewport.addEventListener("resize", onViewportChange);
    window.visualViewport.addEventListener("scroll", onViewportChange);
  }

  // initial sync
  syncNavHeight();
  syncViewportPx();
})();
