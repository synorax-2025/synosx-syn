// tools/lib/site-reporter.mjs
// ESM-only. Minimal governance reporter for synosx-site.
// Output: Markdown report with a standard table:
// | Package | Path | Type | Reason | Name |

import fs from "node:fs/promises";
import path from "node:path";

export function normalizeIssue(raw = {}, fallback = {}) {
  const issue = { ...fallback, ...raw };

  return {
    pkg: String(issue.pkg ?? "synosx-site"),
    path: String(issue.path ?? "-"),
    type: String(issue.type ?? "STRUCTURE"),
    reason: String(issue.reason ?? "-"),
    name: String(issue.name ?? "-"),
    severity: String(issue.severity ?? "WARN"), // PASS | WARN | FAIL
  };
}

export function summarizeIssues(issues) {
  let fail = 0;
  let warn = 0;
  let pass = 0;

  for (const it of issues) {
    if (it.severity === "FAIL") fail += 1;
    else if (it.severity === "WARN") warn += 1;
    else pass += 1;
  }

  return { fail, warn, pass, total: issues.length, ok: fail === 0 };
}

function escCell(v) {
  // Markdown table cell escape (minimal): replace newlines and pipes
  const s = String(v ?? "");
  return s.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

export function renderMarkdownTable(issues) {
  const head = `| Package | Path | Type | Reason | Name |`;
  const sep = `|---|---|---|---|---|`;

  const lines = issues.map((it) => {
    return `| ${escCell(it.pkg)} | ${escCell(it.path)} | ${escCell(it.type)} | ${escCell(it.reason)} | ${escCell(it.name)} |`;
  });

  return [head, sep, ...lines].join("\n");
}

export function renderMarkdownReport({ title, generatedAt, summary, issues }) {
  const ts = generatedAt ?? new Date().toISOString();
  const sumLine = summary.ok
    ? `✅ **OK** — 0 FAIL, ${summary.warn} WARN, ${summary.total} checked`
    : `❌ **FAIL** — ${summary.fail} FAIL, ${summary.warn} WARN, ${summary.total} checked`;

  const bodyTable = issues.length
    ? renderMarkdownTable(issues)
    : `| Package | Path | Type | Reason | Name |\n|---|---|---|---|---|\n| - | - | - | - | - |`;

  return [
    `# ${title}`,
    ``,
    `- Generated: \`${ts}\``,
    `- Result: ${sumLine}`,
    ``,
    `## Issues`,
    ``,
    bodyTable,
    ``,
    `## Notes`,
    `- Columns are fixed for diff-friendly governance evidence.`,
    `- Severity is used for summary gatekeeping (FAIL blocks, WARN reports).`,
    ``,
  ].join("\n");
}

export async function writeReportFile({ outPath, markdown }) {
  const abs = path.resolve(outPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, markdown, "utf8");
  return abs;
}

/**
 * Create a report object from raw issues.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {Array<Object>} opts.issues
 * @param {Object} [opts.fallback]
 */
export function buildReport({ title, issues = [], fallback = {} }) {
  const norm = issues.map((x) => normalizeIssue(x, fallback));
  const summary = summarizeIssues(norm);
  const markdown = renderMarkdownReport({
    title,
    summary,
    issues: norm,
  });

  return { summary, issues: norm, markdown };
}
