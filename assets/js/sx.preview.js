// sx.preview.js
// Read-only image preview (lightbox) + controlled zoom (wheel/trackpad)
// MUST NOT introduce CTA / navigation / product-like interactions.

(function () {
  // Create overlay once
  const preview = document.createElement("div");
  preview.className = "sx-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = `
    <div class="sx-preview__backdrop"></div>
    <img class="sx-preview__img" alt="" />
  `;
  document.body.appendChild(preview);

  const imgEl = preview.querySelector(".sx-preview__img");
  const backdrop = preview.querySelector(".sx-preview__backdrop");

  // Zoom state (overlay-only)
  let scale = 1;
  const MIN = 1;
  const MAX = 2.5;
  const STEP = 0.12;

  function applyScale() {
    imgEl.style.transform = `scale(${scale})`;
  }

  function resetZoom() {
    scale = 1;
    applyScale();
  }

  function open(src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || "";
    preview.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    resetZoom();
  }

  function close() {
    preview.setAttribute("aria-hidden", "true");
    imgEl.src = "";
    imgEl.alt = "";
    document.body.style.overflow = "";
    resetZoom();
  }

  // Open: any image with data-preview
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-preview]");
    if (!target) return;

    // Only react to <img> with src
    const src = target.getAttribute("src");
    if (!src) return;

    open(src, target.getAttribute("alt"));
  });

  // Close actions
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Zoom with wheel/trackpad — only when overlay is open
  imgEl.addEventListener(
    "wheel",
    (e) => {
      if (preview.getAttribute("aria-hidden") !== "false") return;

      // Prevent page scroll while zooming
      e.preventDefault();

      // deltaY > 0 means scroll down -> zoom out; invert for intuitive zoom
      const dir = e.deltaY > 0 ? -1 : 1;
      scale = Math.min(MAX, Math.max(MIN, scale + dir * STEP));
      applyScale();
    },
    { passive: false }
  );
})();
