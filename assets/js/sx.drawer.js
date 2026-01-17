/* sx.drawer.js — Mobile Drawer (shared)
   ✅ Mode A: topbar dropdown under fixed nav
   ✅ Locks scroll while open
   ✅ Use Cases is the only expandable node
   ✅ Close on backdrop / [data-close="sx-drawer"] / ESC
*/

(function sxDrawerBoot(){
  "use strict";

  const btn = document.getElementById("sxMenuBtn");
  const drawer = document.getElementById("sx-mobile-menu");
  if (!btn || !drawer) return;

  const panel = drawer.querySelector(".sx-drawer-panel");
  const backdrop = drawer.querySelector(".sx-drawer-backdrop");
  const closeEls = drawer.querySelectorAll('[data-close="sx-drawer"]');

  // Optional: Use Cases expandable node
  const ucBtn = drawer.querySelector(".sx-drawer-usecases");
  const ucPanel = drawer.querySelector("#sx-usecases-panel");

  function lockScroll(on){
    if (on){
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }else{
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
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
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    lockScroll(true);

    // default: collapsed
    closeUseCases();

    // focus panel for accessibility (safe)
    setTimeout(() => {
      if (panel && typeof panel.focus === "function") panel.focus();
    }, 0);
  }

  function close(){
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    lockScroll(false);

    closeUseCases();

    try{ btn.focus(); }catch(_){}
  }

  // Toggle drawer
  btn.addEventListener("click", () => {
    drawer.classList.contains("is-open") ? close() : open();
  });

  // Backdrop closes
  if (backdrop) backdrop.addEventListener("click", close);

  // Any [data-close] closes
  closeEls.forEach(el => el.addEventListener("click", close));

  // ESC closes
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
  });

  // Use Cases toggle (only expandable node)
  if (ucBtn && ucPanel){
    closeUseCases();
    ucBtn.addEventListener("click", toggleUseCases);
  }
})();
