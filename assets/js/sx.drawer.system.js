// sx.drawer.system.js — SynOSX System Drawer v1.2
// Lens: Entry / Worldview
// - 打开 / 关闭竖排 System Drawer
// - Use Cases 折叠/展开
// - 对外暴露 window.SXSystemDrawer.go(target) 占位钩子

(() => {
  const html = document.documentElement;

  // 触发器（可多个：顶栏按钮 / Orb 等）
  const triggers = Array.from(
    document.querySelectorAll('[data-sx-system-drawer="trigger"]')
  );

  const overlay = document.querySelector(
    '[data-sx-system-drawer="overlay"]'
  );
  const panel = document.querySelector('[data-sx-system-drawer="panel"]');
  const closeBtn = document.querySelector(
    '[data-sx-system-drawer="close"]'
  );

  // 主导航条目
  const items = Array.from(
    document.querySelectorAll("[data-sx-system-target]")
  );

  // Use Cases 折叠组
  const groups = Array.from(
    document.querySelectorAll("[data-sx-system-group]")
  );

  if (!triggers.length || !overlay || !panel) return;

  const state = {
    open: false,
  };

  function setExpanded(v) {
    triggers.forEach((btn) => {
      try {
        btn.setAttribute("aria-expanded", String(v));
      } catch {
        /* ignore */
      }
    });
  }

  function openDrawer() {
    if (state.open) return;
    state.open = true;

    html.classList.add("sx-system-open");
    overlay.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    setExpanded(true);
  }

  function closeDrawer() {
    if (!state.open) return;
    state.open = false;

    html.classList.remove("sx-system-open");
    panel.setAttribute("aria-hidden", "true");
    setExpanded(false);

    // 等过渡结束再隐藏 overlay（避免闪烁）
    setTimeout(() => {
      if (!state.open) overlay.hidden = true;
    }, 240);
  }

  function toggleDrawer() {
    state.open ? closeDrawer() : openDrawer();
  }

  // 触发器点击
  triggers.forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      toggleDrawer();
    });
  });

  // 关闭按钮
  if (closeBtn) {
    closeBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      closeDrawer();
    });
  }

  // 点击 overlay 空白处关闭
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) {
      closeDrawer();
    }
  });

  // ESC 关闭
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && state.open) {
      closeDrawer();
    }
  });

  // Use Cases 折叠组逻辑
  groups.forEach((group) => {
    const toggle = group.querySelector('[data-sx-system-group-toggle]');
    if (!toggle) return;

    toggle.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      const isOpen = group.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });

  // 点击条目：调用 go(target) + 关闭 Drawer
  items.forEach((item) => {
    item.addEventListener("click", (ev) => {
      ev.preventDefault();

      const target = item.getAttribute("data-sx-system-target");
      if (target) {
        if (window.SXSystemDrawer?.go) {
          window.SXSystemDrawer.go(target);
        } else {
          console.log("[SXSystemDrawer] go stub:", target);
        }
      }

      closeDrawer();
    });
  });

  // 对外暴露占位对象
  window.SXSystemDrawer = window.SXSystemDrawer || {};
  window.SXSystemDrawer.go ??= (id) =>
    console.log("[SXSystemDrawer] go stub (default):", id);

  // 如果一开始就处于打开状态，初始化
  if (html.classList.contains("sx-system-open")) {
    state.open = true;
    overlay.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    setExpanded(true);
  }
})();
