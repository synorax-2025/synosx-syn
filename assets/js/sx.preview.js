// sx.preview.js — Read-only image preview (advanced)
// Features:
// - click blank to close (click image keeps open)
// - ESC to close
// - wheel/trackpad zoom anchored at cursor
// - dblclick toggles fit <-> 2x anchored at click
// - drag to pan (desktop)
// - zoom by resizing width/height so viewport can scroll (no transform-crop)

(function () {
  const preview = document.createElement("div");
  preview.className = "sx-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = `
    <div class="sx-preview__backdrop"></div>
    <div class="sx-preview__viewport" role="dialog" aria-modal="true">
      <img class="sx-preview__img" alt="" />
    </div>
    <!-- <div class="sx-preview__hint">Wheel/Pinch to zoom · Double-click to toggle · Click blank to close</div> -->
  `;
  document.body.appendChild(preview);

  const backdrop = preview.querySelector(".sx-preview__backdrop");
  const viewport = preview.querySelector(".sx-preview__viewport");
  const imgEl = preview.querySelector(".sx-preview__img");

  let nw = 0, nh = 0;         // natural image size
  let scale = 1;              // current scale
  let baseFit = 1;            // fit-to-viewport scale (<= 1)
  const MAX_MULT = 3;         // max zoom multiplier relative to baseFit
  const WHEEL_FACTOR = 0.0016;// smaller = less sensitive

  let isOpen = false;

  // Drag-to-pan (desktop)
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let scrollStartL = 0, scrollStartT = 0;

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function applySize() {
    if (!nw || !nh) return;
    imgEl.style.width = `${Math.round(nw * scale)}px`;
    imgEl.style.height = `${Math.round(nh * scale)}px`;
  }

  function computeFitScale() {
    // fit within viewport visible area (padding already counted in clientWidth/Height)
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (!nw || !nh || !vw || !vh) return 1;
    return Math.min(vw / nw, vh / nh, 1);
  }

  function setScale(nextScale, anchorClientX, anchorClientY) {
    const min = baseFit;
    const max = baseFit * MAX_MULT;
    const newScale = clamp(nextScale, min, max);

    // If no real change, skip
    if (Math.abs(newScale - scale) < 0.0001) return;

    // Keep anchor point stable:
    // 1) Get anchor position in viewport scroll space before resize
    const rect = viewport.getBoundingClientRect();
    const ax = anchorClientX - rect.left + viewport.scrollLeft;
    const ay = anchorClientY - rect.top + viewport.scrollTop;

    // 2) Compute relative position over image size (before)
    const oldW = nw * scale;
    const oldH = nh * scale;
    const rx = oldW ? (ax / oldW) : 0.5;
    const ry = oldH ? (ay / oldH) : 0.5;

    // 3) Apply new scale (resize image)
    scale = newScale;
    applySize();

    // 4) After resize, set scroll so that the same relative point stays under cursor
    const newW = nw * scale;
    const newH = nh * scale;

    const targetAx = rx * newW;
    const targetAy = ry * newH;

    const newScrollLeft = targetAx - (anchorClientX - rect.left);
    const newScrollTop  = targetAy - (anchorClientY - rect.top);

    viewport.scrollLeft = newScrollLeft;
    viewport.scrollTop = newScrollTop;
  }

  function centerViewport() {
    const cx = (viewport.scrollWidth - viewport.clientWidth) / 2;
    const cy = (viewport.scrollHeight - viewport.clientHeight) / 2;
    viewport.scrollLeft = cx;
    viewport.scrollTop = cy;
  }

  function open(src, alt) {
    isOpen = true;
    preview.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    imgEl.alt = alt || "";
    imgEl.src = src;

    imgEl.onload = () => {
      nw = imgEl.naturalWidth || 0;
      nh = imgEl.naturalHeight || 0;

      baseFit = computeFitScale();
      scale = baseFit;

      applySize();
      requestAnimationFrame(centerViewport);
    };
  }

  function close() {
    isOpen = false;
    preview.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    imgEl.src = "";
    imgEl.alt = "";
    nw = nh = 0;
    scale = baseFit = 1;

    isDragging = false;
    viewport.classList.remove("is-dragging");
  }

  // --- Open trigger (your page images) ---
  document.addEventListener("click", (e) => {
    const target = e.target.closest("img[data-preview]");
    if (!target) return;
    const src = target.getAttribute("src");
    if (!src) return;
    open(src, target.getAttribute("alt"));
  });

  // --- Click blank closes (image click does NOT) ---
  preview.addEventListener("click", (e) => {
    if (!isOpen) return;
    if (e.target === imgEl) return; // clicking image keeps it open
    close();
  });

  // Prevent viewport click from bubbling as blank-close when dragging ends
  imgEl.addEventListener("click", (e) => {
    if (!isOpen) return;
    e.stopPropagation();
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") close();
  });

  // --- Wheel/trackpad zoom anchored at cursor ---
  viewport.addEventListener("wheel", (e) => {
    if (!isOpen) return;

    // Prevent page scroll
    e.preventDefault();

    // Delta -> zoom factor (smooth)
    // deltaY > 0 => zoom out
    const factor = Math.exp(-e.deltaY * WHEEL_FACTOR);
    const nextScale = scale * factor;

    // Use cursor position as anchor
    setScale(nextScale, e.clientX, e.clientY);
  }, { passive: false });

  // --- Double-click toggle zoom (fit <-> 2x) anchored at click ---
  imgEl.addEventListener("dblclick", (e) => {
    if (!isOpen) return;

    const zoomInScale = clamp(baseFit * 2, baseFit, baseFit * MAX_MULT);
    const nearFit = Math.abs(scale - baseFit) < 0.01;

    const next = nearFit ? zoomInScale : baseFit;
    setScale(next, e.clientX, e.clientY);

    // Avoid accidental text selection / zoom
    e.preventDefault();
  });

  // --- Drag to pan (desktop mouse) ---
  viewport.addEventListener("mousedown", (e) => {
    if (!isOpen) return;
    // Only left button
    if (e.button !== 0) return;

    isDragging = true;
    viewport.classList.add("is-dragging");

    dragStartX = e.clientX;
    dragStartY = e.clientY;
    scrollStartL = viewport.scrollLeft;
    scrollStartT = viewport.scrollTop;

    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isOpen || !isDragging) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    viewport.scrollLeft = scrollStartL - dx;
    viewport.scrollTop  = scrollStartT - dy;
  });

  window.addEventListener("mouseup", () => {
    if (!isOpen) return;
    if (!isDragging) return;

    isDragging = false;
    viewport.classList.remove("is-dragging");
  });

  // Optional: stop native drag ghost
  imgEl.addEventListener("dragstart", (e) => e.preventDefault());
})();
