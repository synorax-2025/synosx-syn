/* sx.core.js — SynOSX Core Behaviors
   Shared, page-agnostic, governance-safe
*/

(function sxCoreBoot(){
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
  // Reveal-on-view animation
  // ----------------------------
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length){
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("active");
        });
      },
      { threshold: 0.12 }
    );

    reveals.forEach(el => io.observe(el));
  }
})();
