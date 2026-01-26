/* sx.drawer.js — v2.2.2 iOS Scroll Fix
   2026-01-25

   修复：iOS 滚动问题 - 完全移除 body lock 的 position 修改
*/

(() => {
  const html   = document.documentElement;
  const body   = document.body;

  const trigger = document.getElementById("sxMenuBtn");
  const drawer  = document.getElementById("sx-mobile-menu");
  if (!trigger || !drawer) return;

  const backdrop = drawer.querySelector(".sx-drawer-backdrop");
  const panel    = drawer.querySelector(".sx-drawer-panel");

  // Use Cases (special)
  const ucBtn   = drawer.querySelector(".sx-drawer-usecases");
  const ucPanel = drawer.querySelector("#sx-usecases-panel");

  // Generic groups (目录等)
  const groupBtns = Array.from(
    drawer.querySelectorAll(".sx-drawer-group[aria-controls]")
  );

  const state = {
    open: false,
    scrollY: 0,
  };

  function syncViewportPx() {
    const h = Math.ceil(window.innerHeight || 0);
    if (h > 0) {
      document.documentElement.style.setProperty("--sx-vh-px", h + "px");
    }
  }

  // ----------------------
  // Body Lock（iOS 修复：只用 overflow，不动 position）
  // ----------------------
  function lockBody() {
    if (html.classList.contains("sx-drawer-open")) return;

    state.scrollY = window.scrollY || window.pageYOffset || 0;

    // 🔧 iOS 修复：只锁 overflow，完全不碰 position
    html.classList.add("sx-drawer-open");
    html.style.overflow = "hidden";
  }

  function unlockBody() {
    if (!html.classList.contains("sx-drawer-open")) return;

    html.style.overflow = "";
    html.classList.remove("sx-drawer-open");
    
    // 恢复滚动位置
    window.scrollTo(0, state.scrollY || 0);
  }

  // ----------------------
  // Use Cases fold
  // ----------------------
  function closeUseCases() {
    if (!ucBtn || !ucPanel) return;
    ucBtn.setAttribute("aria-expanded", "false");
    ucPanel.hidden = true;
  }

  function toggleUseCases() {
    if (!ucBtn || !ucPanel) return;
    const isOpen = ucBtn.getAttribute("aria-expanded") === "true";
    ucBtn.setAttribute("aria-expanded", isOpen ? "false" : "true");
    ucPanel.hidden = isOpen;
  }

  // ----------------------
  // Generic group folds (目录等)
  // ----------------------
  function getGroupPanel(btnEl) {
    const id = btnEl && btnEl.getAttribute("aria-controls");
    if (!id) return null;
    return drawer.querySelector("#" + CSS.escape(id));
  }

  function closeAllGroups() {
    groupBtns.forEach((b) => {
      const p = getGroupPanel(b);
      b.setAttribute("aria-expanded", "false");
      if (p) p.hidden = true;
    });
  }

  function openOnlyThisGroup(btnEl) {
    groupBtns.forEach((b) => {
      const p = getGroupPanel(b);
      const isSelf = b === btnEl;

      b.setAttribute("aria-expanded", isSelf ? "true" : "false");
      if (p) p.hidden = !isSelf;
    });
  }

  function toggleGroup(btnEl) {
    const p = getGroupPanel(btnEl);
    if (!p) return;

    const isOpen = btnEl.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      btnEl.setAttribute("aria-expanded", "false");
      p.hidden = true;
    } else {
      openOnlyThisGroup(btnEl);
    }
  }

  // ----------------------
  // Open / Close
  // ----------------------
  function openDrawer() {
    if (state.open) return;
    state.open = true;

    syncViewportPx();
    lockBody();

    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");

    closeUseCases();
    closeAllGroups();

    requestAnimationFrame(() => {
      try {
        panel && panel.focus();
      } catch {}
    });
  }

  function closeDrawer() {
    if (!state.open) return;
    state.open = false;

    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");

    closeUseCases();
    closeAllGroups();
    unlockBody();

    try {
      trigger.focus();
    } catch {}
  }

  function toggleDrawer() {
    state.open ? closeDrawer() : openDrawer();
  }

  // ----------------------
  // Events
  // ----------------------

  // 触发按钮
  trigger.addEventListener("click", (ev) => {
    ev.preventDefault();
    toggleDrawer();
  });

  // 点击幕布关闭（只在点到幕布本身时关闭）
  if (backdrop) {
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) {
        closeDrawer();
      }
    });
  }

  // Esc 关闭
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && state.open) {
      closeDrawer();
    }
  });

  // close-on-click（任意带 data-close="sx-drawer" 的元素）
  drawer.addEventListener("click", (ev) => {
    const el =
      ev.target &&
      ev.target.closest &&
      ev.target.closest('[data-close="sx-drawer"]');
    if (el) {
      closeDrawer();
    }
  });

  // Use Cases 按钮
  if (ucBtn && ucPanel) {
    closeUseCases();
    ucBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleUseCases();
    });
  }

  // Group 折叠（事件代理）
  drawer.addEventListener("click", (ev) => {
    const gbtn =
      ev.target &&
      ev.target.closest &&
      ev.target.closest(".sx-drawer-group[aria-controls]");
    if (!gbtn) return;
    ev.preventDefault();
    ev.stopPropagation();
    toggleGroup(gbtn);
  });

  // 视口变化时，更新 vh 变量
  function onViewportChange() {
    if (!state.open) return;
    syncViewportPx();
  }

  window.addEventListener("resize", onViewportChange);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onViewportChange);
  }

  // 调试时如果一开始就带 is-open，同步状态
  if (drawer.classList.contains("is-open")) {
    state.open = true;
    drawer.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    lockBody();
    requestAnimationFrame(syncViewportPx);
  } else {
    syncViewportPx();
  }
})();
