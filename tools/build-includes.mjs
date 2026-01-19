/* tools/build-includes.mjs — static include builder (no deps, ESM) */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PARTIALS_DIR = path.join(ROOT, "partials");
const DIST_DIR = path.join(ROOT, "dist");

const NAV_PARTIAL_PATH = path.join(PARTIALS_DIR, "nav.partial.html");
const INCLUDE_TOKEN = "<!--@include nav-->";

function readText(p){ return fs.readFileSync(p, "utf8"); }

function ensureDir(p){
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest){
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries){
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()){
      // don't copy dist into dist
      if (e.name === "dist" || e.name === ".git") continue;
      copyDir(s, d);
    } else {
      // we will rebuild html separately; still copy other files
      if (e.name.endsWith(".html")) continue;
      ensureDir(path.dirname(d));
      fs.copyFileSync(s, d);
    }
  }
}

function buildHtmlFiles(navPartial){
  const files = fs.readdirSync(ROOT).filter(f => f.endsWith(".html"));
  for (const f of files){
    const inPath = path.join(ROOT, f);
    const outPath = path.join(DIST_DIR, f);
    const src = readText(inPath);

    if (!src.includes(INCLUDE_TOKEN)){
      // If page doesn't use include token, pass through unchanged
      ensureDir(path.dirname(outPath));
      fs.writeFileSync(outPath, src, "utf8");
      continue;
    }

    const out = src.replace(INCLUDE_TOKEN, navPartial);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, out, "utf8");
  }
}

function main(){
  if (!fs.existsSync(NAV_PARTIAL_PATH)){
    throw new Error(`Missing: ${NAV_PARTIAL_PATH}`);
  }
  const navPartial = readText(NAV_PARTIAL_PATH);

  // Recreate dist
  if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);

  // Copy assets/tools/partials etc (excluding html)
  copyDir(ROOT, DIST_DIR);

  // Build root html files with includes
  buildHtmlFiles(navPartial);

  console.log("✅ build-includes: dist/ generated.");
}

main();
