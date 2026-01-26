/* sx.drawer.js — v2.3.2
   2026-01-25

   Fix:
   - Remove duplicated `const backdrop` declaration
   - Keep Entry Registry + Legacy Fallback
   - Keep iOS scroll fix (overflow only)
*/

(() => {
  const html = document.documentElement;

  const drawer = document.getElementById("sx-mobile-menu");
  if (!drawer) return;

  // ----------------------
  // Entry Registry + Legacy Fallback
  // ----------------------
  const registry = document.querySelector("[data-sx-entry-registry]");

  let triggerIds = [];
  if (registry) {
    const ds = registry.dataset;
    if (ds.desktopEntry) triggerIds.push(ds.desktopEntry);
    if (ds.mobileEntry) triggerIds.push(ds.mobileEntry);
  }

  let triggers = triggerIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!triggers.length) {
    const legacy =
      document.getElementById("sx-menu-button") ||
      document.getElementById("sxMenuBtn");
    if (legacy) triggers = [legacy];
  }

  if (!triggers.length) return;

  // ----------------------
  // Core Elements (DECLARE ONCE)
  // ----------------------
  const backdrop = drawer.querySelector(".sx-drawer-backdrop");
  const panel    = drawer.querySelector(".sx-drawer-panel");

  // Use Cases
  const ucBtn   = drawer.querySelector(".sx-drawer-usecases");
  const ucPanel = drawer.querySelector("#sx-usecases-panel");

  // Generic groups
  const groupBtns = Array.from(
    drawer.querySelectorAll(".sx-drawer-group[aria-controls]")
  );

  const state = {
    open: false,
    scrollY: 0,
    lastTrigger: null,
  };

  function syncViewportPx() {
    const h = Math.ceil(window.innerHeight || 0);
    if (h > 0) {
      html.style.setProperty("--sx-vh-px", h + "px");
    }
  }

  // ----------------------
  // Body Lock (iOS safe)
  // ----------------------
  function lockBody() {
    if (html.classList.contains("sx-drawer-open")) return;
    state.scrollY = window.scrollY || window.pageYOffset || 0;
    html.classList.add("sx-drawer-open");
    html.style.overflow = "hidden";
  }

  function unlockBody() {
    if (!html.classList.contains("sx-drawer-open")) return;
    html.style.overflow = "";
    html.classList.remove("sx-drawer-open");
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
  // Groups fold
  // ----------------------
  function getGroupPanel(btnEl) {
    const id = btnEl?.getAttribute("aria-controls");
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
    isOpen
      ? (btnEl.setAttribute("aria-expanded", "false"), (p.hidden = true))
      : openOnlyThisGroup(btnEl);
  }

  function setTriggersExpanded(isOpen) {
    triggers.forEach((t) => {
      try {
        t.setAttribute("aria-expanded", isOpen ? "true" : "false");
      } catch {}
    });
  }

  // ----------------------
  // Open / Close
  // ----------------------
  function openDrawer(sourceTrigger) {
    if (state.open) return;
    state.open = true;

    state.lastTrigger =
      sourceTrigger && triggers.includes(sourceTrigger)
        ? sourceTrigger
        : state.lastTrigger || triggers[0];

    syncViewportPx();
    lockBody();

    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    setTriggersExpanded(true);

    closeUseCases();
    closeAllGroups();

    requestAnimationFrame(() => {
      try {
        panel?.focus();
      } catch {}
    });
  }

  function closeDrawer() {
    if (!state.open) return;
    state.open = false;

    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    setTriggersExpanded(false);

    closeUseCases();
    closeAllGroups();
    unlockBody();

    try {
      state.lastTrigger?.focus();
    } catch {}
  }

  function toggleDrawer(sourceTrigger) {
    state.open ? closeDrawer() : openDrawer(sourceTrigger);
  }

  // ----------------------
  // Events
  // ----------------------
  triggers.forEach((trg) => {
    trg.addEventListener("click", (ev) => {
      ev.preventDefault();
      toggleDrawer(trg);
    });
  });

  if (backdrop) {
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closeDrawer();
    });
  }

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && state.open) closeDrawer();
  });

  drawer.addEventListener("click", (ev) => {
    const el = ev.target?.closest?.('[data-close="sx-drawer"]');
    if (el) closeDrawer();
  });

  if (ucBtn && ucPanel) {
    closeUseCases();
    ucBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleUseCases();
    });
  }

  drawer.addEventListener("click", (ev) => {
    const gbtn = ev.target?.closest?.(".sx-drawer-group[aria-controls]");
    if (!gbtn) return;
    ev.preventDefault();
    ev.stopPropagation();
    toggleGroup(gbtn);
  });

  function onViewportChange() {
    if (state.open) syncViewportPx();
  }

  window.addEventListener("resize", onViewportChange);
  window.visualViewport?.addEventListener("resize", onViewportChange);

  if (drawer.classList.contains("is-open")) {
    state.open = true;
    drawer.setAttribute("aria-hidden", "false");
    setTriggersExpanded(true);
    lockBody();
    requestAnimationFrame(syncViewportPx);
  } else {
    syncViewportPx();
  }
})();
