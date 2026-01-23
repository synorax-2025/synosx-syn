// sx.dock.js — SynOSX Audit Dock for current HTML
// 结构约定：
// #sxDockAudit.sx-dock
//   .sx-dock__edgeHandle         ← 门把手
//   .sx-floatlog__panel
//     .sx-dock__header[data-sx-dock-drag]  ← 顶栏（可拖拽）
//       [data-sx-dock-action="collapse"]   ← “—” 按钮
//       [data-sx-dock-action="close"]      ← “×” 按钮
//     .sx-dock__body.sx-floatlog__body     ← 日志内容区域

(function () {
  "use strict";

  const EDGE_THRESHOLD = 36; // 离边缘多少像素内算“贴边”
  const EDGE_PAD = 8;        // 浮动模式最小边距

  const root = document.getElementById("sxDockAudit");
  if (!root) return;

  const header = root.querySelector(".sx-dock__header");
  const edgeHandle = root.querySelector(".sx-dock__edgeHandle");
  const statusEl = root.querySelector("[data-sx-dock-status]");
  const btnCollapse = root.querySelector('[data-sx-dock-action="collapse"]');
  const btnClose = root.querySelector('[data-sx-dock-action="close"]');

  if (!header) return;

  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function isDockedLeft() {
    return root.classList.contains("sx-dock--docked-left");
  }
  function isDockedRight() {
    return root.classList.contains("sx-dock--docked-right");
  }
  function isDocked() {
    return isDockedLeft() || isDockedRight();
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function updateStatus() {
    if (root.classList.contains("sx-dock--hidden")) {
      setStatus("HIDDEN");
      return;
    }
    if (!isDocked()) {
      setStatus("FLOATING · CENTER");
      return;
    }
    const side = isDockedLeft() ? "LEFT" : "RIGHT";
    const mode = root.classList.contains("sx-dock--collapsed")
      ? "DOCKED"
      : "OPEN";
    setStatus(`${mode} · ${side}`);
  }

  // 退出 dock + 折叠
  function undock() {
    root.classList.remove("sx-dock--docked-left");
    root.classList.remove("sx-dock--docked-right");
    root.classList.remove("sx-dock--collapsed");
    updateStatus();
  }

  // 从当前位置 dock 到指定边（不判断阈值）
  function dockToSide(side) {
    const rect = root.getBoundingClientRect();
    const vh = window.innerHeight;
    const h = rect.height;

    // 垂直方向 clamp 一下，避免超出屏幕
    let top = rect.top;
    const minTop = EDGE_PAD;
    const maxTop = vh - h - EDGE_PAD;
    top = clamp(top, minTop, maxTop);

    undock(); // 清旧状态

    root.style.top = top + "px";

    if (side === "left") {
      root.classList.add("sx-dock--docked-left");
      root.style.left = "0px";
      root.style.right = "auto";
    } else {
      root.classList.add("sx-dock--docked-right");
      root.style.right = "0px";
      root.style.left = "auto";
    }

    updateStatus();
  }

  // 拖拽结束后：如接近边缘，自动 dock + 折叠
  function snapDockIfNeeded() {
    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;

    const dLeft = rect.left;
    const dRight = vw - (rect.left + rect.width);
    const min = Math.min(dLeft, dRight);

    if (min > EDGE_THRESHOLD) {
      // 离两侧远：继续浮动
      updateStatus();
      return;
    }

    const side = dLeft <= dRight ? "left" : "right";
    dockToSide(side);

    // 贴边后默认折叠成门把手
    root.classList.add("sx-dock--collapsed");
    updateStatus();
  }

  // ---------------- 拖拽逻辑 ----------------
  function onPointerDown(e) {
    // 点到按钮就别开始拖
    if (e.target.closest("[data-sx-dock-action]")) return;
    if (e.target.closest(".sx-dock__edgeHandle")) return;

    // 只接受左键 / 单指
    if (e.button != null && e.button !== 0) return;

    dragging = true;
    pointerId = e.pointerId;

    const rect = root.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    undock();
    root.classList.add("is-dragging");

    try {
      header.setPointerCapture(pointerId);
    } catch {}

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const newLeft = clamp(
      startLeft + dx,
      EDGE_PAD,
      vw - rect.width - EDGE_PAD
    );
    const newTop = clamp(
      startTop + dy,
      EDGE_PAD,
      vh - rect.height - EDGE_PAD
    );

    root.style.left = newLeft + "px";
    root.style.top = newTop + "px";
    root.style.right = "auto";
  }

  function onPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    dragging = false;
    root.classList.remove("is-dragging");

    try {
      header.releasePointerCapture(pointerId);
    } catch {}
    pointerId = null;

    snapDockIfNeeded();
  }

  header.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  // ---------------- 门把手逻辑 ----------------
  if (edgeHandle) {
    edgeHandle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!isDocked()) return;
      root.classList.toggle("sx-dock--collapsed");
      updateStatus();
    });

    edgeHandle.addEventListener("pointerdown", function (e) {
      // 避免门把手触发拖拽
      e.stopPropagation();
    });
  }

  // ---------------- 按钮：- / x ----------------
  if (btnCollapse) {
    btnCollapse.addEventListener("click", function (e) {
      e.stopPropagation();

      if (!isDocked()) {
        // 还在中间：dock 到最近边，再折叠
        const rect = root.getBoundingClientRect();
        const vw = window.innerWidth;
        const dLeft = rect.left;
        const dRight = vw - (rect.left + rect.width);
        const side = dLeft <= dRight ? "left" : "right";
        dockToSide(side);
        root.classList.add("sx-dock--collapsed");
      } else {
        // 已贴边：切换折叠 / 展开
        root.classList.toggle("sx-dock--collapsed");
      }

      updateStatus();
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", function (e) {
      e.stopPropagation();
      root.classList.add("sx-dock--hidden");
      // 兼容旧逻辑：有些地方可能会看 is-hidden
      root.classList.add("is-hidden");
      updateStatus();
    });
  }

  // ---------------- 窗口尺寸变化：clamp 一下 ----------------
  window.addEventListener("resize", function () {
    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const newLeft = clamp(rect.left, EDGE_PAD, vw - rect.width - EDGE_PAD);
    const newTop = clamp(rect.top, EDGE_PAD, vh - rect.height - EDGE_PAD);

    root.style.left = newLeft + "px";
    root.style.top = newTop + "px";
    root.style.right = "auto";
  });

  // 初始化一次状态文本
  updateStatus();
})();
