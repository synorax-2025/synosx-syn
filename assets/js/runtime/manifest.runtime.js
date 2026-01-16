/* runtime/manifest.runtime.js — manifest-only runtime
   - navbar scrolled
   - reveal observer
*/

(function manifestRuntime(){
  const navbar = document.getElementById("navbar");
  if (navbar){
    window.addEventListener("scroll", () => {
      if (window.scrollY > 12) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    }, { passive: true });
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reveals && reveals.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("active");
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => io.observe(el));
  }
})();
