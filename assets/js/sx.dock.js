// sx.dock.js — SynOSX Dock Behavior (Audit Dock v1)
// 负责：拖动 / 吸附 / 门把手 / 展开折叠 / 关闭
(function () {
  const dock = document.getElementById("sxDockAudit");
  if (!dock) return;

  const edgeHandle = dock.querySelector(".sx-dock__edgeHandle");
  const dragHandle = dock.querySelector("[data-sx-dock-drag]") || dock;
  const btnCollapse = dock.querySelector('[data-sx-dock-action="collapse"]');
  const btnClose = dock.querySelector('[data-sx-dock-action="close"]');
  const statusEl = dock.querySelector("[data-sx-dock-status]");

  const SNAP_THRESHOLD = 80;

  const state = {
    dragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    centerY: window.innerHeight / 2,
    side: "right",      // "left" | "right"
    mode: "floating",   // "floating" | "docked"
    expanded: true
  };

  function updateStatus() {
    if (!statusEl) return;

    if (dock.classList.contains("sx-dock--hidden")) {
      statusEl.textContent = "HIDDEN";
      return;
    }

    if (state.mode === "floating") {
      statusEl.textContent = "FLOATING · CENTER";
      return;
    }

    const sideText = (state.side || "EDGE").toUpperCase();
    const modeText = state.expanded ? "OPEN" : "DOCKED";
    statusEl.textContent = `${modeText} · ${sideText}`;
  }

  function clampFloatingPosition() {
    const rect = dock.getBoundingClientRect();
    const margin = 12;

    let left = rect.left;
    let top = rect.top;

    const maxLeft = window.innerWidth - rect.width - margin;
    const maxTop = window.innerHeight - rect.height - margin;

    if (left < margin) left = margin;
    if (left > maxLeft) left = maxLeft;
    if (top < margin + parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sx-safe-top") || "0", 10)) {
      top = margin + parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sx-safe-top") || "0", 10);
    }
    if (top > maxTop - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sx-safe-bottom") || "0", 10)) {
      top = maxTop - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sx-safe-bottom") || "0", 10);
    }

    dock.style.left = left + "px";
    dock.style.top = top + "px";
    dock.style.right = "auto";

    state.centerY = top + rect.height / 2;
  }

  function applyDock(side, options = {}) {
    const { collapse = false, keepY = false } = options;

    state.mode = "docked";
    state.side = side;

    const rect = dock.getBoundingClientRect();
    const margin = 32;
    const halfHeight = rect.height / 2 || 80;

    let centerY = keepY ? state.centerY : rect.top + halfHeight;
    const minCenter = margin + halfHeight;
    const maxCenter = window.innerHeight - margin - halfHeight;

    if (centerY < minCenter) centerY = minCenter;
    if (centerY > maxCenter) centerY = maxCenter;
    state.centerY = centerY;

    const top = centerY - halfHeight;
    dock.style.top = top + "px";

    dock.classList.remove(
      "sx-dock--floating",
      "sx-dock--docked-left",
      "sx-dock--docked-right"
    );

    if (side === "left") {
      dock.classList.add("sx-dock--docked-left");
      dock.style.left = "0px";
      dock.style.right = "auto";
    } else {
      dock.classList.add("sx-dock--docked-right");
      dock.style.right = "-4px";
      dock.style.left = "auto";
    }

    if (collapse) {
      dock.classList.add("sx-dock--collapsed");
      dock.classList.remove("sx-dock--expanded");
      state.expanded = false;
    } else {
      dock.classList.add("sx-dock--expanded");
      dock.classList.remove("sx-dock--collapsed");
      state.expanded = true;
    }

    updateStatus();
  }

  function dockToNearestEdgeAndToggle() {
    const rect = dock.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const vw = window.innerWidth;
    const side = centerX < vw / 2 ? "left" : "right";

    applyDock(side, { collapse: !state.expanded });
  }

  function toggleExpand() {
    if (state.mode !== "docked") {
      dockToNearestEdgeAndToggle();
      return;
    }

    if (state.expanded) {
      dock.classList.add("sx-dock--collapsed");
      dock.classList.remove("sx-dock--expanded");
      state.expanded = false;
    } else {
      dock.classList.add("sx-dock--expanded");
      dock.classList.remove("sx-dock--collapsed");
      state.expanded = true;
    }
    updateStatus();
  }

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    state.dragging = true;
    dock.classList.add("is-dragging");

    const rect = dock.getBoundingClientRect();
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;

    dock.classList.remove("sx-dock--docked-left", "sx-dock--docked-right");
    dock.classList.add("sx-dock--floating", "sx-dock--expanded");
    dock.classList.remove("sx-dock--collapsed");

    state.mode = "floating";
    state.side = null;
    state.expanded = true;
    updateStatus();

    // 移动端：避免拖 dock 时整个页面跟着滚
    document.body.style.overscrollBehavior = "none";
  }

  function onPointerMove(e) {
    if (!state.dragging) return;

    const newLeft = e.clientX - state.offsetX;
    const newTop = e.clientY - state.offsetY;

    state.centerY = newTop + dock.offsetHeight / 2;

    dock.style.left = newLeft + "px";
    dock.style.right = "auto";
    dock.style.top = newTop + "px";
  }

  function onPointerUp(e) {
    if (!state.dragging) return;
    state.dragging = false;
    dock.classList.remove("is-dragging");
    document.body.style.overscrollBehavior = "";

    const x = e.clientX;
    const vw = window.innerWidth;

    const distLeft = x;
    const distRight = vw - x;

    if (distLeft <= SNAP_THRESHOLD || distRight <= SNAP_THRESHOLD) {
      const side = distLeft < distRight ? "left" : "right";
      applyDock(side, { collapse: true });
    } else {
      clampFloatingPosition();
      state.mode = "floating";
      state.side = null;
      state.expanded = true;

      dock.classList.add("sx-dock--floating", "sx-dock--expanded");
      dock.classList.remove(
        "sx-dock--collapsed",
        "sx-dock--docked-left",
        "sx-dock--docked-right"
      );

      updateStatus();
    }
  }

  function onMinimizeClick(e) {
    e.stopPropagation();
    if (state.mode === "floating") {
      const rect = dock.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const vw = window.innerWidth;
      const side = centerX < vw / 2 ? "left" : "right";
      applyDock(side, { collapse: true });
    } else {
      toggleExpand();
    }
  }

  function onCloseClick(e) {
    e.stopPropagation();
    dock.classList.add("sx-dock--hidden");
    updateStatus();
  }

  function init() {
    // 初始：浮动在右侧偏中
    dock.classList.add("sx-dock--floating", "sx-dock--expanded", "sx-dock--docked-right");
    updateStatus();

    dragHandle.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    if (edgeHandle) {
      edgeHandle.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleExpand();
      });
      edgeHandle.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
    }

    if (btnCollapse) {
      btnCollapse.addEventListener("click", onMinimizeClick);
    }
    if (btnClose) {
      btnClose.addEventListener("click", onCloseClick);
    }

    window.addEventListener("resize", function () {
      if (state.mode === "docked" && state.side) {
        applyDock(state.side, { keepY: true });
      } else {
        clampFloatingPosition();
      }
    });
  }

  init();
})();
