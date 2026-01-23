// sx.menu.js — Menu 控制 + OS 级 Tab 滑块

(() => {
  const html = document.documentElement;

  // ✅ 支持多个触发器（顶栏按钮 + 移动端 FAB）
  const triggers = Array.from(document.querySelectorAll('[data-sx-menu="trigger"]'));

  const overlay = document.querySelector('[data-sx-menu="overlay"]');
  const panel = document.querySelector('[data-sx-menu="panel"]');
  const closeBtn = document.querySelector('[data-sx-menu="close"]');
  const tabs = Array.from(document.querySelectorAll("[data-sx-menu-tab]"));
  const sections = Array.from(document.querySelectorAll("[data-sx-menu-panel]"));
  const items = Array.from(document.querySelectorAll(".sx-menu-item"));
  const tabsContainer = document.querySelector(".sx-menu-tabs");

  if (triggers.length === 0 || !overlay || !panel || !tabsContainer) return;

  // 创建滑块元素
  let slider = document.querySelector(".sx-menu-tab-slider");
  if (!slider) {
    slider = document.createElement("div");
    slider.className = "sx-menu-tab-slider";
    tabsContainer.appendChild(slider);
  }

  const state = {
    open: false,
    activeTab: "chapters", // chapters / synosx / cases / whitepaper
  };

  function setExpanded(v) {
    triggers.forEach((btn) => {
      // 不是所有 trigger 都一定有 aria-expanded（例如你未来可能换成 <a>）
      try {
        btn.setAttribute("aria-expanded", String(v));
      } catch {}
    });
  }

  function updateSlider() {
    const activeTab = tabs.find((t) => t.classList.contains("is-active"));
    if (!activeTab || !slider) return;

    const parentRect = tabsContainer.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const left = tabRect.left - parentRect.left;
    const width = tabRect.width;

    slider.style.left = `${left}px`;
    slider.style.width = `${width}px`;
    slider.style.opacity = "1";
  }

  function openMenu() {
    if (state.open) return;
    state.open = true;

    html.classList.add("sx-menu-open");
    overlay.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    setExpanded(true);

    // 打开时计算一次滑块（下一帧保证布局已完成）
    requestAnimationFrame(() => {
      updateSlider();
    });
  }

  function closeMenu() {
    if (!state.open) return;
    state.open = false;

    html.classList.remove("sx-menu-open");
    panel.setAttribute("aria-hidden", "true");
    setExpanded(false);

    setTimeout(() => {
      if (!state.open) overlay.hidden = true;
    }, 240);
  }

  function toggleMenu() {
    state.open ? closeMenu() : openMenu();
  }

  function switchTab(next) {
    if (state.activeTab === next) return;
    state.activeTab = next;

    tabs.forEach((tab) => {
      const name = tab.getAttribute("data-sx-menu-tab");
      const active = name === next;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    sections.forEach((sec) => {
      const name = sec.getAttribute("data-sx-menu-panel");
      const active = name === next;
      sec.classList.toggle("is-active", active);
    });

    updateSlider();
  }

  // 事件绑定 ----

  // ✅ 绑定所有触发器
  triggers.forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      toggleMenu();
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) closeMenu();
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && state.open) closeMenu();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.getAttribute("data-sx-menu-tab");
      if (!name) return;
      switchTab(name);
    });
  });

  // 点击条目：现在只打印日志 + 关闭（以后可接入滚动）
  items.forEach((item) => {
    item.addEventListener("click", () => {
      const chapter = item.getAttribute("data-sx-chapter");
      const layer = item.getAttribute("data-sx-layer");

      if (chapter) {
        if (window.SXMenu?.scrollToChapter) {
          window.SXMenu.scrollToChapter(chapter);
        } else {
          console.log("[SXMenu] goto chapter:", chapter);
        }
      }

      if (layer) {
        if (window.SXMenu?.scrollToLayer) {
          window.SXMenu.scrollToLayer(layer);
        } else {
          console.log("[SXMenu] goto layer:", layer);
        }
      }

      closeMenu();
    });
  });

  // 窗口尺寸变化时，更新滑块位置
  window.addEventListener("resize", () => {
    if (!state.open) return;
    updateSlider();
  });

  // 对外暴露占位钩子
  window.SXMenu = window.SXMenu || {};
  window.SXMenu.scrollToChapter ??= (id) =>
    console.log("[SXMenu] scrollToChapter stub:", id);
  window.SXMenu.scrollToLayer ??= (id) =>
    console.log("[SXMenu] scrollToLayer stub:", id);

  // 如果一开始就处于打开状态，初始化滑块
  if (html.classList.contains("sx-menu-open")) {
    state.open = true;
    overlay.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    setExpanded(true);
    requestAnimationFrame(updateSlider);
  }
})();
