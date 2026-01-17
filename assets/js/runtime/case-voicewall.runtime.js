// assets/js/runtime/case-voicewall.runtime.js
(function bootCaseVoiceWallRuntime(){
  const navbar = document.getElementById("navbar");

  function onScroll(){
    if (!navbar) return;
    if (window.scrollY > 12) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting){
        e.target.classList.add("active");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });

  reveals.forEach(el => io.observe(el));
})();
