/* sx.core.js — SynOSX Core Behaviors
   Shared, page-agnostic, governance-safe
*/

(function sxCoreBoot(){
  const boot = () => {
    // ----------------------------
    // Navbar scroll state
    // ----------------------------
    const navbar = document.getElementById("navbar");
    if (navbar){
      const onScroll = () => {
        if (window.scrollY > 12) navbar.classList.add("scrolled");
        else navbar.classList.remove("scrolled");
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    // ----------------------------
    // Reveal governance
    // ----------------------------
    const reveals = Array.from(document.querySelectorAll(".reveal"));
    if (!reveals.length) return;

    const activateAll = () => reveals.forEach(el => el.classList.add("active"));

    // ✅ Mobile policy: never hide content by animation
    const mq = window.matchMedia("(max-width: 980px)");
    if (mq.matches){
      activateAll();
      return;
    }

    // ✅ If IO not supported: show all
    if (!("IntersectionObserver" in window)){
      activateAll();
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting){
          e.target.classList.add("active");
          try { io.unobserve(e.target); } catch {}
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => io.observe(el));

    // ✅ hard fallback: if something goes wrong, never leave page blank
    // (some mobile/webview IO implementations miss first callback)
    setTimeout(() => {
      const hidden = reveals.filter(el => !el.classList.contains("active")).length;
      if (hidden === reveals.length) activateAll();
    }, 300);

    // ✅ if user resizes into mobile width later, force show
    mq.addEventListener?.("change", (e) => {
      if (e.matches) activateAll();
    });
  };

  // ✅ guarantee DOM is ready
  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
