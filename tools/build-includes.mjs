/* tools/build-includes.mjs — static include builder (no deps, ESM)
   ✅ Reads registry/site.nav.json (Single Source of Truth)
   ✅ Builds per-page nav+drawer HTML and injects into html via <!--@include nav-->
   ✅ Recreates dist/: copies non-html assets, rebuilds html with injected nav
   ✅ Supports nested pages (pages/** etc) with auto href prefixing
   ❌ No compatibility layer (no sub/as/kind/cta fallback)

   IMPORTANT:
   - site.nav.json 内部链接必须统一写成“站点根相对”：例如 "cases.html" / "pages/case-video.html"
   - 不要写 "../cases.html"、"./cases.html"、"/cases.html"（否则会跳出 dist 或被二次前缀）
*/

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");

const NAV_CONFIG_PATH = path.join(ROOT, "registry", "site.nav.json");
const INCLUDE_TOKEN = "<!--@include nav-->";

// Exclude folders from dist copy (source-only / tooling / repo internals)
const EXCLUDE_DIR_NAMES = new Set([
  "dist",
  ".git",
  "node_modules",
  "tools",
  "registry",
  "partials",
  "zzdocs",
]);

function readText(p) {
  return fs.readFileSync(p, "utf8");
}
function readJson(p) {
  return JSON.parse(readText(p));
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);

    if (e.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(e.name)) continue;
      copyDir(s, d);
      continue;
    }

    // rebuild html later
    if (e.name.endsWith(".html")) continue;

    ensureDir(path.dirname(d));
    fs.copyFileSync(s, d);
  }
}

/** Recursively list all .html files (relative paths) under root, excluding EXCLUDE_DIR_NAMES */
function listHtmlFilesRec(absDir, relBase = "") {
  const out = [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  for (const e of entries) {
    const abs = path.join(absDir, e.name);

    if (e.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(e.name)) continue;
      out.push(...listHtmlFilesRec(abs, path.join(relBase, e.name)));
      continue;
    }

    if (e.isFile() && e.name.endsWith(".html")) {
      out.push(path.join(relBase, e.name));
    }
  }
  return out;
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
      out[k] = mergeDeep(base?.[k], override[k]);
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

function joinClasses(...xs) {
  return xs
    .flat()
    .filter(Boolean)
    .join(" ")
    .trim();
}

/* -------------------- Href prefix (critical fix) -------------------- */

function isExternalOrSpecialHref(href) {
  if (!href) return true;

  // external / special
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  )
    return true;

  // already relative => DO NOT prefix again (prevents "../../cases.html" escaping dist)
  if (href.startsWith("../") || href.startsWith("./")) return true;

  // absolute path (generally avoid in site.nav.json)
  if (href.startsWith("/")) return true;

  return false;
}

function withPrefix(href, prefix) {
  if (!href) return href;
  if (!prefix) return href;
  if (isExternalOrSpecialHref(href)) return href;
  return `${prefix}${href}`;
}

function calcPrefixForRelHtml(relHtmlPath) {
  const p = relHtmlPath.replaceAll("\\", "/");
  const dir = path.posix.dirname(p);
  if (!dir || dir === ".") return "";
  const parts = dir.split("/").filter(Boolean);
  return "../".repeat(parts.length);
}

/* -------------------- Rendering: Desktop -------------------- */

function renderDesktopNav(desktop = {}, prefix) {
  const links = desktop.links ?? [];
  const usecases = desktop.usecases ?? null;
  const tail = desktop.tail ?? [];

  const items = []
    .concat(
      links.map(
        (l) =>
          `<li><a href="${escapeHtml(withPrefix(l.href, prefix))}">${escapeHtml(
            l.label
          )}</a></li>`
      )
    )
    .concat(renderUseCasesDesktop(usecases, prefix))
    .concat(
      tail.map(
        (t) =>
          `<li><a href="${escapeHtml(withPrefix(t.href, prefix))}">${escapeHtml(
            t.label
          )}</a></li>`
      )
    )
    .join("");

  if (!items) return "";
  return `<ul class="nav-links nav-desktop" aria-label="Desktop Navigation">${items}</ul>`;
}

function renderUseCasesDesktop(usecases, prefix) {
  if (!usecases || usecases.enabled === false) return [];

  const label = usecases.label ?? "Use Cases";
  const items = (usecases.items ?? [])
    .map((it) => {
      if (it?.type === "divider")
        return `<div class="nav-drop-divider" role="separator" aria-hidden="true"></div>`;

      const ext = it?.externalMark
        ? `<span aria-hidden="true">↗</span>`
        : `<span aria-hidden="true"></span>`;

      if (it?.subtitle) {
        return `
          <a role="menuitem"${attr(
            "href",
            withPrefix(it.href, prefix)
          )} class="nav-drop-narratives">
            <span>${escapeHtml(it.label)}</span>
            <span class="nav-drop-sub">${escapeHtml(it.subtitle)}</span>
          </a>
        `.trim();
      }

      return `
        <a role="menuitem"${attr("href", withPrefix(it.href, prefix))}>
          <span>${escapeHtml(it.label)}</span>${ext}
        </a>
      `.trim();
    })
    .join("");

  return [
    `
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
    `.trim(),
  ];
}

/* -------------------- Rendering: Actions (Topbar) -------------------- */

function renderTopbarActions(actions = {}, prefix) {
  const secondary = actions.secondary ?? null;
  const primary = actions.primary ?? null;

  const parts = [];

  // Mobile menu trigger always exists; visibility controlled by CSS
  parts.push(
    `
    <button
      id="sxMenuBtn"
      class="btn-secondary nav-menu-btn"
      type="button"
      aria-label="Open Menu"
      aria-controls="sx-mobile-menu"
      aria-expanded="false">☰ Menu</button>
  `.trim()
  );

  // Secondary
  if (secondary) {
    if (secondary.type !== "link") {
      throw new Error(
        `actions.secondary must be {type:"link", ...}. Got type="${secondary.type}".`
      );
    }
    parts.push(
      `<a class="btn-secondary"${attr(
        "href",
        withPrefix(secondary.href, prefix)
      )}>${escapeHtml(secondary.label)}</a>`
    );
  }

  // Primary
  if (primary) {
    if (primary.type === "button") {
      const cls = joinClasses("cta-button", primary.class);
      parts.push(
        `<button class="${escapeHtml(cls)}"${attr(
          "id",
          primary.id
        )} type="button">${escapeHtml(primary.label)}</button>`
      );
    } else if (primary.type === "link") {
      const cls = joinClasses("cta-button", primary.class);
      parts.push(
        `<a class="${escapeHtml(cls)}"${attr(
          "href",
          withPrefix(primary.href, prefix)
        )}>${escapeHtml(primary.label)}</a>`
      );
    } else {
      throw new Error(
        `actions.primary must be type "link" or "button". Got "${primary.type}".`
      );
    }
  }

  return `<div class="nav-actions">${parts.join("")}</div>`;
}

/* -------------------- Rendering: Drawer -------------------- */

function renderDrawerLinks(links = [], prefix) {
  return links
    .map(
      (l) =>
        `<a href="${escapeHtml(
          withPrefix(l.href, prefix)
        )}" data-close="sx-drawer">${escapeHtml(l.label)}</a>`
    )
    .join("");
}

function renderDrawerTail(tail = [], prefix) {
  return tail
    .map(
      (l) =>
        `<a href="${escapeHtml(
          withPrefix(l.href, prefix)
        )}" data-close="sx-drawer">${escapeHtml(l.label)}</a>`
    )
    .join("");
}

function renderDrawerUsecases(usecases, prefix) {
  if (!usecases || usecases.enabled === false) return "";

  const label = usecases.label ?? "Use Cases";
  const items = (usecases.items ?? [])
    .map((it) => {
      if (it?.type === "divider") return `<div class="sx-drawer-divider"></div>`;

      const ext = it?.externalMark ? `<span aria-hidden="true"> ↗</span>` : "";

      if (it?.subtitle) {
        return `
          <a class="sx-drawer-narratives" href="${escapeHtml(
            withPrefix(it.href, prefix)
          )}" data-close="sx-drawer">
            <span class="sx-drawer-narratives-title">${escapeHtml(it.label)}</span>
            <span class="sx-drawer-narratives-sub">${escapeHtml(it.subtitle)}</span>
          </a>
        `.trim();
      }

      return `<a href="${escapeHtml(
        withPrefix(it.href, prefix)
      )}" data-close="sx-drawer">${escapeHtml(it.label)}${ext}</a>`;
    })
    .join("");

  return `
    <button class="sx-drawer-usecases" type="button" aria-expanded="false" aria-controls="sx-usecases-panel">
      ${escapeHtml(label)} <span class="sx-usecases-caret" aria-hidden="true">▸</span>
    </button>
    <div id="sx-usecases-panel" hidden>
      ${items}
    </div>
  `.trim();
}

function renderDrawerActions(actions = [], prefix) {
  if (!actions.length) return "";

  const btns = actions
    .map((a) => {
      const role = a.role || "secondary";
      const baseCls = role === "primary" ? "cta-button" : "btn-secondary";
      const cls = joinClasses(baseCls, a.class);

      if (a.type === "button") {
        return `<button class="${escapeHtml(cls)}"${attr(
          "id",
          a.id
        )} type="button">${escapeHtml(a.label)}</button>`;
      }

      if (a.type === "link") {
        return `<a class="${escapeHtml(cls)}"${attr(
          "href",
          withPrefix(a.href, prefix)
        )} data-close="sx-drawer">${escapeHtml(a.label)}</a>`;
      }

      throw new Error(
        `drawer.actions[] must be type "link" or "button". Got "${a.type}".`
      );
    })
    .join("");

  return `<div class="sx-drawer-actions">${btns}</div>`;
}

/* -------------------- Shell -------------------- */

function renderNavShell(resolved, prefix) {
  const brand = resolved.brand || {};
  const desktop = resolved.desktop || {};
  const drawer = resolved.drawer || {};

  const brandName = brand.name || "SynOSX";
  const brandSubtitle = brand.subtitle || "· Governance OS";
  const brandHref = brand.href || "index.html";

  const brandHtml = `
    <a class="logo" href="${escapeHtml(withPrefix(brandHref, prefix))}" aria-label="${escapeHtml(
    brandName
  )} Home">
      <div class="logo-icon">SX</div>
      <span>
        <b>${escapeHtml(brandName)}</b>
        <span class="logo-sub" data-sx="nav-sub">${escapeHtml(brandSubtitle)}</span>
      </span>
    </a>
  `.trim();

  const desktopUl = renderDesktopNav(desktop, prefix);
  const actions = renderTopbarActions(resolved.actions || {}, prefix);

  const nav = `
    <nav id="navbar" aria-label="Primary Navigation">
      <div class="nav-content">
        ${brandHtml}
        ${desktopUl}
        ${actions}
      </div>
    </nav>
  `.trim();

  const drawerBrand = `
    <div class="sx-drawer-brand">
      <div class="logo-icon">SX</div>
      <div class="sx-drawer-title">
        <div class="sx-drawer-name">${escapeHtml(brandName)}</div>
        <div class="sx-drawer-sub" data-sx="drawer-sub">${escapeHtml(
          brandSubtitle.replace(/^·\s*/, "")
        )}</div>
      </div>
    </div>
  `.trim();

  const drawerLinks = renderDrawerLinks(drawer.links || [], prefix);
  const drawerUsecases = renderDrawerUsecases(drawer.usecases || null, prefix);
  const drawerTail = renderDrawerTail(drawer.tail || [], prefix);
  const drawerActions = renderDrawerActions(drawer.actions || [], prefix);

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

/* -------------------- Resolve -------------------- */

function resolvePageNav(config, pageKey) {
  const defaults = config.defaults || {};
  const page = config.pages?.[pageKey] || {};
  return mergeDeep(defaults, page);
}

function pageKeyFromFilename(relPath) {
  const p = relPath.replaceAll("\\", "/");
  return path.posix.basename(p, ".html"); // index => index, pages/case-video.html => case-video
}

/* -------------------- Build -------------------- */

function buildHtmlFiles(config) {
  const relFiles = listHtmlFilesRec(ROOT);

  for (const rel of relFiles) {
    const inPath = path.join(ROOT, rel);
    const outPath = path.join(DIST_DIR, rel);
    const src = readText(inPath);

    ensureDir(path.dirname(outPath));

    if (!src.includes(INCLUDE_TOKEN)) {
      fs.writeFileSync(outPath, src, "utf8");
      continue;
    }

    const prefix = calcPrefixForRelHtml(rel); // ✅ critical
    const key = pageKeyFromFilename(rel);
    const resolved = resolvePageNav(config, key);
    const navHtml = renderNavShell(resolved, prefix);

    const out = src.replace(INCLUDE_TOKEN, navHtml);
    fs.writeFileSync(outPath, out, "utf8");
  }
}

function assertBasicConfig(config) {
  if (!config || typeof config !== "object")
    throw new Error("site.nav.json: invalid JSON root.");
  if (!config.defaults) throw new Error("site.nav.json: missing defaults.");
  if (!config.pages) throw new Error("site.nav.json: missing pages.");
  if (!config.defaults.brand)
    throw new Error("site.nav.json: missing defaults.brand.");
  if (!("subtitle" in config.defaults.brand))
    throw new Error(
      'site.nav.json: defaults.brand.subtitle is required (no "sub" allowed).'
    );
}

function main() {
  if (!fs.existsSync(NAV_CONFIG_PATH)) {
    throw new Error(`Missing: ${NAV_CONFIG_PATH}`);
  }

  const config = readJson(NAV_CONFIG_PATH);
  assertBasicConfig(config);

  // Recreate dist
  if (fs.existsSync(DIST_DIR))
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);

  // Copy everything (excluding html + excluded source folders)
  copyDir(ROOT, DIST_DIR);

  // Build html with per-page nav
  buildHtmlFiles(config);

  console.log("✅ build-includes: dist/ generated.");
}

main();
