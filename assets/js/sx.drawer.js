/* sx.drawer.js — Frozen v1.2 (iOS scroll fix)
   ✅ iOS stable: background locked + allow panel scroll
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

  // ✅ iOS: prevent background scroll but allow panel scroll
  function onDrawerTouchMove(e){
    // drawer 层默认阻止滚动（防止带动页面/viewport）
    e.preventDefault();
  }

  function onPanelTouchStart(e){
    touchStartY = e.touches ? e.touches[0].clientY : 0;
  }

  function onPanelTouchMove(e){
    // 允许 panel 内滚动，但要防止“橡皮筋”把滚动传到页面
    // 逻辑：当 panel 在顶且向下拉，或在底且向上推 → 阻止默认（否则会带动页面）
    if (!panel) return;

    const curY = e.touches ? e.touches[0].clientY : 0;
    const deltaY = curY - touchStartY;

    const atTop = panel.scrollTop <= 0;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;

    if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)){
      e.preventDefault();
      return;
    }

    // ✅ 关键：阻断冒泡，避免 drawer/backdrop 的 preventDefault 吃掉滚动
    e.stopPropagation();
  }

  function enableIosScrollFix(){
    // 注意：passive 必须是 false，否则 preventDefault 无效
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

  function open(){
    syncNavHeight();
    syncViewportPx();

    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");

    closeUseCases();
    lockBodyFixed(true);

    enableIosScrollFix();

    // 不要强制 scrollTop=0（你在 manifest 看章节很多时，会让用户每次打开都回顶部）
    // 如果你坚持要回顶，打开这一行即可：
    // try{ if (panel) panel.scrollTop = 0; }catch(_){}

    setTimeout(() => { try{ panel && panel.focus(); }catch(_){} }, 0);
  }

  function close(){
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");

    disableIosScrollFix();

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

  function onViewportChange(){
    if (!drawer.classList.contains("is-open")) return;
    syncViewportPx();
    syncNavHeight();
  }

  window.addEventListener("resize", onViewportChange);

  if (window.visualViewport){
    window.visualViewport.addEventListener("resize", onViewportChange);
    // ⚠️ 这一行经常会在 iOS 上造成“滚动时频繁触发”，我建议删掉：
    // window.visualViewport.addEventListener("scroll", onViewportChange);
  }

  syncNavHeight();
  syncViewportPx();
})();
