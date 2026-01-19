/* tools/build-includes.mjs — static include builder (no deps, ESM)
   ✅ Reads registry/site.nav.json
   ✅ Builds per-page nav+drawer HTML and injects into root html via <!--@include nav-->
   ✅ Copies all non-html into dist/, rebuilds html with injected nav
*/

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");

const NAV_CONFIG_PATH = path.join(ROOT, "registry", "site.nav.json");
const INCLUDE_TOKEN = "<!--@include nav-->";

function readText(p) { return fs.readFileSync(p, "utf8"); }
function readJson(p) { return JSON.parse(readText(p)); }

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);

    if (e.isDirectory()) {
      if (e.name === "dist" || e.name === ".git" || e.name === "node_modules") continue;
      copyDir(s, d);
    } else {
      if (e.name.endsWith(".html")) continue; // rebuild html later
      ensureDir(path.dirname(d));
      fs.copyFileSync(s, d);
    }
  }
}

function isPlainObject(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}

/**
 * Deep merge with array-replace semantics:
 * - objects: deep merge
 * - arrays: override entirely (page wins)
 * - scalars: override
 */
function mergeDeep(base, override) {
  if (override === undefined) return base;

  if (Array.isArray(base) || Array.isArray(override)) {
    return override !== undefined ? override : base;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const out = { ...base };
    for (const k of Object.keys(override)) {
      out[k] = mergeDeep(base[k], override[k]);
    }
    return out;
  }

  return override;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function attr(name, value) {
  if (value === undefined || value === null || value === "") return "";
  return ` ${name}="${escapeHtml(value)}"`;
}

function renderNavLinks(links = []) {
  if (!links.length) return "";
  const items = links.map(l => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`).join("");
  return `<ul class="nav-links nav-desktop" aria-label="Desktop Navigation">${items}</ul>`;
}

function renderUseCasesDesktop(usecases) {
  if (!usecases || usecases.enabled === false) return "";
  const label = usecases.label ?? "Use Cases";
  const items = (usecases.items ?? []).map(it => {
    if (it.type === "divider") return `<div class="nav-drop-divider" aria-hidden="true"></div>`;
    const ext = it.externalMark ? `<span aria-hidden="true">↗</span>` : `<span aria-hidden="true"></span>`;
    if (it.sub) {
      return `
        <a role="menuitem"${attr("href", it.href)} class="nav-drop-narratives">
          <span>${escapeHtml(it.label)}</span>
          <span class="nav-drop-sub">${escapeHtml(it.sub)}</span>
        </a>
      `.trim();
    }
    return `
      <a role="menuitem"${attr("href", it.href)}>
        <span>${escapeHtml(it.label)}</span>${ext}
      </a>
    `.trim();
  }).join("");

  return `
    <li class="nav-dropdown">
      <a href="#usecases"
         class="nav-drop-trigger"
         aria-haspopup="true"
         aria-expanded="false"
         aria-controls="usecases-menu">
        ${escapeHtml(label)} <span aria-hidden="true" class="nav-caret">▾</span>
      </a>
      <div id="usecases-menu" class="nav-drop-menu" role="menu" aria-label="Use Cases Submenu">
        ${items}
      </div>
    </li>
  `.trim();
}

function renderNavTail(tail = []) {
  if (!tail.length) return "";
  return tail.map(t => `<li><a href="${escapeHtml(t.href)}">${escapeHtml(t.label)}</a></li>`).join("");
}

function renderActions(actions = {}) {
  // Standard: secondary (a), primary (a or button)
  const secondary = actions.secondary;
  const primary = actions.primary;

  const parts = [];

  // mobile menu trigger always exists; visibility controlled by sx.drawer.css
  parts.push(`
    <button
      id="sxMenuBtn"
      class="btn-secondary nav-menu-btn"
      type="button"
      aria-label="Open Menu"
      aria-controls="sx-mobile-menu"
      aria-expanded="false">☰ Menu</button>
  `.trim());

  if (secondary && secondary.label && secondary.href) {
    parts.push(`<a class="btn-secondary" href="${escapeHtml(secondary.href)}">${escapeHtml(secondary.label)}</a>`);
  }

  if (primary && primary.label) {
    const as = primary.as || "a";
    if (as === "button") {
      const cls = ["cta-button"].concat(primary.class ? [primary.class] : []).join(" ");
      parts.push(
        `<button class="${escapeHtml(cls)}"${attr("id", primary.id)} type="button">${escapeHtml(primary.label)}</button>`
      );
    } else {
      parts.push(`<a class="cta-button" href="${escapeHtml(primary.href || "#")}">${escapeHtml(primary.label)}</a>`);
    }
  }

  return `<div class="nav-actions">${parts.join("")}</div>`;
}

function renderDesktopNav(desktop, usecases) {
  const linksHtml = renderNavLinks(desktop.links || []);
  const tailHtml = renderNavTail(desktop.tail || []);
  const usecasesHtml = renderUseCasesDesktop(usecases);

  // If we have nav-links list, we need to inject usecases + tail into same list.
  // We render a single UL for desktop: links + dropdown + tail.
  const items = []
    .concat((desktop.links || []).map(l => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`))
    .concat(usecasesHtml ? [usecasesHtml] : [])
    .concat(tailHtml ? [tailHtml] : [])
    .join("");

  if (!items) return "";
  return `<ul class="nav-links nav-desktop" aria-label="Desktop Navigation">${items}</ul>`;
}

function renderDrawerUsecases(usecases) {
  if (!usecases || usecases.enabled === false) return "";

  const label = usecases.label ?? "Use Cases";
  const items = (usecases.items ?? []).map(it => {
    if (it.type === "divider") return `<div class="sx-drawer-divider"></div>`;
    const ext = it.externalMark ? `<span aria-hidden="true"> ↗</span>` : "";
    if (it.sub) {
      return `
        <a class="sx-drawer-narratives" href="${escapeHtml(it.href)}" data-close="sx-drawer">
          <span class="sx-drawer-narratives-title">${escapeHtml(it.label)}</span>
          <span class="sx-drawer-narratives-sub">${escapeHtml(it.sub)}</span>
        </a>
      `.trim();
    }
    return `<a href="${escapeHtml(it.href)}" data-close="sx-drawer">${escapeHtml(it.label)}${ext}</a>`;
  }).join("");

  return `
    <button class="sx-drawer-usecases" type="button" aria-expanded="false" aria-controls="sx-usecases-panel">
      ${escapeHtml(label)} <span class="sx-usecases-caret" aria-hidden="true">▸</span>
    </button>
    <div id="sx-usecases-panel" hidden>
      ${items}
    </div>
  `.trim();
}

function renderDrawerLinks(links = []) {
  return links.map(l => `<a href="${escapeHtml(l.href)}" data-close="sx-drawer">${escapeHtml(l.label)}</a>`).join("");
}

function renderDrawerTail(tail = []) {
  return tail.map(l => `<a href="${escapeHtml(l.href)}" data-close="sx-drawer">${escapeHtml(l.label)}</a>`).join("");
}

function renderDrawerActions(actions = []) {
  if (!actions.length) return "";
  const btns = actions.map(a => {
    const kind = a.kind || "secondary";
    const cls = kind === "primary" ? "cta-button" : "btn-secondary";

    const as = a.as || "a";
    if (as === "button") {
      const extra = a.class ? ` ${escapeHtml(a.class)}` : "";
      return `<button class="${cls}${extra}"${attr("id", a.id)} type="button">${escapeHtml(a.label)}</button>`;
    }
    return `<a class="${cls}" href="${escapeHtml(a.href || "#")}" data-close="sx-drawer">${escapeHtml(a.label)}</a>`;
  }).join("");

  return `<div class="sx-drawer-actions">${btns}</div>`;
}

function renderNavShell(resolved) {
  const brand = resolved.brand || {};
  const desktop = resolved.desktop || {};
  const drawer = resolved.drawer || {};
  const usecasesDesktop = desktop.usecases ?? resolved.desktop?.usecases;
  const usecasesDrawer = drawer.usecases ?? resolved.drawer?.usecases;

  // Brand
  const brandHtml = `
    <a class="logo" href="${escapeHtml(brand.href || "index.html")}" aria-label="${escapeHtml(brand.name || "SynOSX")} Home">
      <div class="logo-icon">SX</div>
      <span>
        <b>${escapeHtml(brand.name || "SynOSX")}</b>
        <span class="logo-sub" data-sx="nav-sub">${escapeHtml(brand.sub || "· Governance OS")}</span>
      </span>
    </a>
  `.trim();

  const desktopUl = renderDesktopNav(desktop, desktop.usecases);
  const actions = renderActions(resolved.actions || {});

  const nav = `
    <nav id="navbar" aria-label="Primary Navigation">
      <div class="nav-content">
        ${brandHtml}
        ${desktopUl}
        ${actions}
      </div>
    </nav>
  `.trim();

  // Drawer brand
  const drawerBrand = `
    <div class="sx-drawer-brand">
      <div class="logo-icon">SX</div>
      <div class="sx-drawer-title">
        <div class="sx-drawer-name">${escapeHtml(brand.name || "SynOSX")}</div>
        <div class="sx-drawer-sub" data-sx="drawer-sub">${escapeHtml((brand.sub || "· Governance OS").replace(/^·\s*/, ""))}</div>
      </div>
    </div>
  `.trim();

  const drawerLinks = renderDrawerLinks(drawer.links || []);
  const drawerUsecases = renderDrawerUsecases(drawer.usecases);
  const drawerTail = renderDrawerTail(drawer.tail || []);
  const drawerActions = renderDrawerActions(drawer.actions || []);

  const drawerHtml = `
    <div id="sx-mobile-menu" class="sx-drawer" aria-hidden="true">
      <div class="sx-drawer-backdrop" data-close="sx-drawer" aria-hidden="true"></div>

      <aside class="sx-drawer-panel" role="dialog" aria-modal="true" aria-label="Mobile Navigation" tabindex="-1">
        <div class="sx-drawer-top">
          ${drawerBrand}
          <button class="sx-drawer-close" type="button" data-close="sx-drawer" aria-label="Close Menu">✕</button>
        </div>

        <nav class="sx-drawer-nav" aria-label="Mobile Links">
          ${drawerLinks}
          ${drawerUsecases}
          ${drawerTail}
        </nav>

        ${drawerActions}
      </aside>
    </div>
  `.trim();

  return `${nav}\n\n${drawerHtml}`;
}

function resolvePageNav(config, pageKey) {
  const defaults = config.defaults || {};
  const page = (config.pages && config.pages[pageKey]) ? config.pages[pageKey] : {};

  // merge order: defaults -> page
  const resolved = mergeDeep(defaults, page);

  // Compatibility: if someone used actions.cta, map it to actions.primary
  if (resolved.actions && resolved.actions.cta && !resolved.actions.primary) {
    resolved.actions.primary = resolved.actions.cta;
  }
  return resolved;
}

function pageKeyFromFilename(filename) {
  const base = path.basename(filename, ".html");
  return base === "index" ? "index" : base; // manifest.html -> manifest, replay.html -> replay
}

function buildHtmlFiles(config) {
  const files = fs.readdirSync(ROOT).filter(f => f.endsWith(".html"));
  for (const f of files) {
    const inPath = path.join(ROOT, f);
    const outPath = path.join(DIST_DIR, f);
    const src = readText(inPath);

    ensureDir(path.dirname(outPath));

    if (!src.includes(INCLUDE_TOKEN)) {
      fs.writeFileSync(outPath, src, "utf8");
      continue;
    }

    const key = pageKeyFromFilename(f);
    const resolved = resolvePageNav(config, key);
    const navHtml = renderNavShell(resolved);

    const out = src.replace(INCLUDE_TOKEN, navHtml);
    fs.writeFileSync(outPath, out, "utf8");
  }
}

function main() {
  if (!fs.existsSync(NAV_CONFIG_PATH)) {
    throw new Error(`Missing: ${NAV_CONFIG_PATH}`);
  }

  const config = readJson(NAV_CONFIG_PATH);

  // Recreate dist
  if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);

  // Copy everything (excluding html)
  copyDir(ROOT, DIST_DIR);

  // Build html with per-page nav
  buildHtmlFiles(config);

  console.log("✅ build-includes: dist/ generated.");
}

main();
