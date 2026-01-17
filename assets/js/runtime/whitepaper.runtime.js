/* whitepaper.runtime.js — page runtime (thin shell)
   - navbar scrolled
   - reveal observer
   - toc scrollspy
*/

(function whitepaperRuntime(){
  "use strict";

  // -----------------------------
  // Navbar shadow (safe)
  // -----------------------------
  const navbar = document.getElementById("navbar");
  if (navbar){
    const onScroll = () => {
      if (window.scrollY > 12) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // -----------------------------
  // Reveal animations (safe)
  // -----------------------------
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length){
    const io = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting) e.target.classList.add("active");
      }
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  // -----------------------------
  // TOC scrollspy (safe)
  // -----------------------------
  const toc = document.getElementById("toc");
  if (!toc) return;

  const tocLinks = toc.querySelectorAll('a[href^="#"]');
  if (!tocLinks.length) return;

  const sections = Array.from(tocLinks)
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries){
      if (!entry.isIntersecting) continue;
      const id = entry.target.getAttribute("id");
      tocLinks.forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    }
  }, { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });

  sections.forEach(s => spy.observe(s));
})();
