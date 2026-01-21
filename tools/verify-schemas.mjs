/* tools/verify-schemas.mjs — Unified AJV schema verifier (ESM)
   - Reads registry/schemas.map.json (Single Source of Truth)
   - Validates registry/assets JSON against schemas/*.schema.json
   - Outputs:
     - zzdocs/reports/verify-schemas.json
     - zzdocs/reports/verify-schemas.md
   - Result rows are STRICT 5 fields:
     { id, mode, file, ok, errors }

   Fix:
   - Preload ALL schemas under schemas/ (recursive) into AJV so $ref by $id resolves.
   - validateSchema:false to avoid meta-schema URL resolution crashes.
*/

import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const ROOT = process.cwd();

const MAP_PATH = path.join(ROOT, "registry", "schemas.map.json");
const SCHEMAS_DIR = path.join(ROOT, "schemas");

const REPORT_DIR = path.join(ROOT, "zzdocs", "reports");
const REPORT_NAME = "verify-schemas";
const REPORT_JSON = path.join(REPORT_DIR, `${REPORT_NAME}.json`);
const REPORT_MD = path.join(REPORT_DIR, `${REPORT_NAME}.md`);

/* -------------------- utils -------------------- */

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function readJson(p) {
  return JSON.parse(readText(p));
}

function writeText(p, s) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

function toPosix(p) {
  return String(p).replaceAll("\\", "/");
}

function rel(p) {
  return toPosix(path.relative(ROOT, p));
}

function isPlainObject(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}

function normalizeMap(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("schemas.map.json: invalid JSON root.");
  }
  const entries = Array.isArray(raw.entries) ? raw.entries : null;
  if (!entries) {
    throw new Error('schemas.map.json: missing "entries" array.');
  }
  return { version: raw.version || "0.0.0", entries };
}

/* -------------------- glob (minimal) -------------------- */
/**
 * Supports patterns like:
 * - assets/data/narratives/cases/*.json
 */
function expandGlob(patternAbs) {
  const p = toPosix(patternAbs);
  const idx = p.lastIndexOf("/*");
  if (idx < 0) {
    throw new Error(`glob mode expects pattern containing '/*' in last segment: ${p}`);
  }

  const dir = p.slice(0, idx);
  const tail = p.slice(idx + 1);

  const absDir = dir;
  if (!fs.existsSync(absDir)) return [];

  const entries = fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);

  const rx = wildcardToRegex(tail);
  return entries.filter((name) => rx.test(name)).map((name) => path.join(absDir, name));
}

function wildcardToRegex(w) {
  const s = String(w || "");
  const parts = s.split("*").map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const body = parts.join(".*");
  return new RegExp(`^${body}$`, "i");
}

/* -------------------- schema discovery (recursive) -------------------- */

function listSchemaFilesRec(absDir) {
  const out = [];
  if (!fs.existsSync(absDir)) return out;

  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(absDir, e.name);
    if (e.isDirectory()) {
      out.push(...listSchemaFilesRec(abs));
      continue;
    }
    if (e.isFile() && e.name.endsWith(".schema.json")) {
      out.push(abs);
    }
  }
  return out;
}

/* -------------------- AJV setup -------------------- */

function createAjv() {
  return new Ajv2020({
    allErrors: true,
    strict: false,
    allowUnionTypes: true,
    validateSchema: false
  });
}

function addSchemaOrThrow(ajv, schemaAbsPath) {
  const schema = readJson(schemaAbsPath);
  const schemaId = schema?.$id;

  if (!schemaId || typeof schemaId !== "string") {
    throw new Error(`Schema missing $id: ${rel(schemaAbsPath)}`);
  }

  ajv.addSchema(schema, schemaId);
  return schemaId;
}

function preloadAllSchemasOrThrow(ajv) {
  const schemaAbsList = listSchemaFilesRec(SCHEMAS_DIR);
  if (!schemaAbsList.length) return { count: 0 };

  schemaAbsList.sort((a, b) => rel(a).localeCompare(rel(b)));
  for (const abs of schemaAbsList) addSchemaOrThrow(ajv, abs);

  return { count: schemaAbsList.length };
}

function getSchemaIdFromFile(schemaAbsPath) {
  if (!fs.existsSync(schemaAbsPath)) {
    throw new Error(`schema file not found: ${rel(schemaAbsPath)}`);
  }
  const s = readJson(schemaAbsPath);
  const id = s?.$id;
  if (!id || typeof id !== "string") {
    throw new Error(`schema missing $id: ${rel(schemaAbsPath)}`);
  }
  return id;
}

/* -------------------- error formatting (stable) -------------------- */

function formatAjvErrors(errors) {
  if (!errors || !errors.length) return [];
  return errors.map((e) => {
    const at = e.instancePath && e.instancePath.length ? e.instancePath : "/";
    const msg = e.message || "invalid";
    const kw = e.keyword ? ` [${e.keyword}]` : "";
    return `${at}: ${msg}${kw}`;
  });
}

/* -------------------- reporting context (minimal RC) -------------------- */

async function rcAttach(kind, payload) {
  if (kind === "json") writeJson(REPORT_JSON, payload);
}

async function rcFinalize(payload) {
  return payload;
}

/* -------------------- markdown report -------------------- */

function renderMarkdown(payload) {
  const { name, ok, summary, results } = payload;

  const lines = [];
  lines.push(`# ${name}`);
  lines.push(``);
  lines.push(`- ok: **${ok ? "true" : "false"}**`);
  lines.push(`- files: **${summary.files}**`);
  lines.push(`- failed: **${summary.failed}**`);
  lines.push(`- map: \`${summary.map}\``);
  lines.push(`- generatedAt: \`${summary.generatedAt}\``);
  lines.push(``);
  lines.push(`## Results (5-field rows)`);
  lines.push(``);
  lines.push(`| id | mode | file | ok | errors |`);
  lines.push(`|---|---|---|---|---|`);

  for (const r of results) {
    const errCount = Array.isArray(r.errors) ? r.errors.length : 0;
    lines.push(
      `| ${escapePipe(r.id)} | ${escapePipe(r.mode)} | \`${escapePipe(r.file)}\` | ${
        r.ok ? "✅" : "❌"
      } | ${errCount} |`
    );
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    lines.push(``);
    lines.push(`## Failures`);
    for (const r of failed) {
      lines.push(``);
      lines.push(`### ${r.id} — \`${r.file}\``);
      for (const e of r.errors || []) lines.push(`- ${escapeMd(e)}`);
    }
  }

  lines.push(``);
  return lines.join("\n");
}

function escapePipe(s) {
  return String(s).replaceAll("|", "\\|");
}

function escapeMd(s) {
  return String(s).replaceAll("\r\n", "\n").replaceAll("\n", " ");
}

/* -------------------- main -------------------- */

async function main() {
  if (!fs.existsSync(MAP_PATH)) {
    throw new Error(`Missing: ${rel(MAP_PATH)}`);
  }

  const mapRaw = readJson(MAP_PATH);
  const map = normalizeMap(mapRaw);

  const ajv = createAjv();

  // 0) Preload ALL schemas once
  preloadAllSchemasOrThrow(ajv);

  /** @type {{id:string, mode:string, file:string, ok:boolean, errors:string[]}[]} */
  const results = [];

  for (const ent of map.entries) {
    const id = String(ent.id || "unknown");
    const mode = String(ent.mode || "single");

    const schemaAbs = path.join(ROOT, ent.schema || "");
    let schemaId;
    try {
      schemaId = getSchemaIdFromFile(schemaAbs);
    } catch (e) {
      results.push({
        id,
        mode,
        file: ent.data ? String(ent.data) : "(missing data)",
        ok: false,
        errors: [String(e?.message || e)]
      });
      continue;
    }

    const validator = ajv.getSchema(schemaId);
    if (!validator) {
      results.push({
        id,
        mode,
        file: ent.data ? String(ent.data) : "(missing data)",
        ok: false,
        errors: [`validator not found for schemaId: ${schemaId}`]
      });
      continue;
    }

    const dataRef = String(ent.data || "");
    const dataAbs = path.join(ROOT, dataRef);

    const targets = mode === "glob" ? expandGlob(dataAbs) : [dataAbs];

    if (!targets.length) {
      results.push({
        id,
        mode,
        file: rel(dataAbs),
        ok: false,
        errors: [`no files matched (${mode})`]
      });
      continue;
    }

    for (const fileAbs of targets) {
      if (!fs.existsSync(fileAbs)) {
        results.push({
          id,
          mode,
          file: rel(fileAbs),
          ok: false,
          errors: ["file not found"]
        });
        continue;
      }

      let data;
      try {
        data = readJson(fileAbs);
      } catch (e) {
        results.push({
          id,
          mode,
          file: rel(fileAbs),
          ok: false,
          errors: [`invalid JSON: ${String(e?.message || e)}`]
        });
        continue;
      }

      const valid = validator(data);
      const errs = valid ? [] : formatAjvErrors(validator.errors);

      results.push({
        id,
        mode,
        file: rel(fileAbs),
        ok: !!valid,
        errors: errs
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  const payload = {
    name: REPORT_NAME,
    ok: failed.length === 0,
    summary: {
      map: rel(MAP_PATH),
      files: results.length,
      failed: failed.length,
      generatedAt: new Date().toISOString()
    },
    results
  };

  ensureDir(REPORT_DIR);

  // --------制度段落（必须存在）--------
  await rcAttach("json", payload);
  await rcFinalize(payload);
  // -----------------------------------

  writeText(REPORT_MD, renderMarkdown(payload));

  // --------CLI 统一输出（必须存在）--------
  if (payload.ok)
    console.log("✅ verify-schemas 校验通过 —— 说明所有 registry/assets JSON 均符合对应 schema。");
  else
    console.log("❌ verify-schemas 校验失败 —— 详情见 zzdocs/reports/verify-schemas.md。");
  // -------------------------------------

  if (!payload.ok) process.exitCode = 1;
}

main().catch((e) => {
  ensureDir(REPORT_DIR);

  const payload = {
    name: REPORT_NAME,
    ok: false,
    summary: {
      map: rel(MAP_PATH),
      files: 0,
      failed: 1,
      generatedAt: new Date().toISOString()
    },
    results: [
      {
        id: "verify-schemas",
        mode: "single",
        file: rel(MAP_PATH),
        ok: false,
        errors: [String(e?.stack || e?.message || e)]
      }
    ]
  };

  // --------制度段落（必须存在）--------
  rcAttach("json", payload).then(() => rcFinalize(payload));
  // -----------------------------------

  writeText(REPORT_MD, renderMarkdown(payload));

  // --------CLI 统一输出（必须存在）--------
  if (payload.ok)
    console.log("✅ verify-schemas 校验通过 —— 说明所有 registry/assets JSON 均符合对应 schema。");
  else
    console.log("❌ verify-schemas 校验失败 —— 详情见 zzdocs/reports/verify-schemas.md。");
  // -------------------------------------

  process.exitCode = 1;
});
