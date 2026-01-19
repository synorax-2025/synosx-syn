/* sx.nav-config.js — apply A/B/C page metas to nav.partial */

(function(){
  function getMeta(name){
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? (el.getAttribute("content") || "").trim() : "";
  }

  const navSub = getMeta("sx-nav-sub");
  const ctaText = getMeta("sx-nav-cta-text");
  const ctaHref = getMeta("sx-nav-cta-href");
  const drawerSub = getMeta("sx-drawer-sub");

  // A
  const a = document.querySelector('[data-sx="nav-sub"]');
  if (a && navSub) a.textContent = navSub;

  // B (top CTA)
  const b = document.querySelector('[data-sx="nav-cta"]');
  if (b){
    if (ctaText) b.textContent = ctaText;
    if (ctaHref) b.setAttribute("href", ctaHref);
  }

  // Drawer CTA mirrors top CTA
  const b2 = document.querySelector('[data-sx="drawer-cta"]');
  if (b2){
    if (ctaText) b2.textContent = ctaText;
    if (ctaHref) b2.setAttribute("href", ctaHref);
  }

  // C
  const c = document.querySelector('[data-sx="drawer-sub"]');
  if (c && drawerSub) c.textContent = drawerSub;
})();
