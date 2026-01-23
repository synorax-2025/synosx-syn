// sx.orb.js — SynOSX Orb State Controller (v1)
// Responsibility:
// - Visual state sync with Menu open / close
// - One-time pulse on open
// - Active / idle state management
//
// Depends on:
// - <button class="sx-orb">
// - html.sx-menu-open (set by sx.menu.js)

(() => {
  const html = document.documentElement;
  const orb = document.querySelector(".sx-orb");
  const orbCore = orb?.querySelector(".sx-orb-core");

  if (!orb || !orbCore) return;

  const ACTIVE_CLASS = "sx-orb-active";
  const PULSE_CLASS = "sx-orb-pulse";

  let isActive = false;

  function onMenuOpen() {
    if (isActive) return;
    isActive = true;

    orb.classList.add(ACTIVE_CLASS);

    // Trigger one-time pulse
    orbCore.classList.remove(PULSE_CLASS);
    // force reflow to restart animation
    void orbCore.offsetWidth;
    orbCore.classList.add(PULSE_CLASS);
  }

  function onMenuClose() {
    if (!isActive) return;
    isActive = false;

    orb.classList.remove(ACTIVE_CLASS);
    orbCore.classList.remove(PULSE_CLASS);
  }

  // Initial sync (in case menu is open on load)
  if (html.classList.contains("sx-menu-open")) {
    onMenuOpen();
  }

  // Observe html class changes (system-level, decoupled)
  const observer = new MutationObserver(() => {
    if (html.classList.contains("sx-menu-open")) {
      onMenuOpen();
    } else {
      onMenuClose();
    }
  });

  observer.observe(html, {
    attributes: true,
    attributeFilter: ["class"],
  });
})();
