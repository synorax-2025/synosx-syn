// tools/verify-site-structure.mjs
import fs from "node:fs/promises";
import path from "node:path";

import { buildReport, writeReportFile } from "./lib/site-reporter.mjs";

// ⛳ 你自己的 RC Bridge（按你仓库实际路径改一下 import）
import { rcAttach, rcFinalize } from "./lib/reporting-context.mjs"; // <- 你现有的 RC 工具

const NAME = "verify-site-structure";
const REPORT_MD = `zzdocs/reports/${NAME}.md`;

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readText(p) {
  return await fs.readFile(p, "utf8");
}

function push(issues, it) {
  issues.push({
    pkg: "synosx-site",
    ...it,
  });
}

async function main() {
  const payload = {
    ok: true,
    name: NAME,
    issues: [],
    summary: null,
    report: { md: REPORT_MD },
  };

  // ✅ 制度段落 1/2
  await rcAttach("json", payload);

  const issues = [];

  // -----------------------------
  // v1: 最小结构裁决（示例）
  // 你可以在这里逐步加规则
  // -----------------------------

  // 1) 根级页面必须存在
  const requiredRoots = [
    "index.html",
    "cases.html",
    "replay.html",
    "manifest.html",
    "whitepaper.html",
    "narratives.html",
  ];

  for (const f of requiredRoots) {
    if (!(await fileExists(f))) {
      push(issues, {
        path: f,
        type: "STRUCTURE",
        reason: "root page missing (一级导航页缺失)",
        name: "ROOT_PAGE_REQUIRED",
        severity: "FAIL",
      });
    }
  }

  // 2) index.html 必须包含 nav include（你现在就是这个制度）
  if (await fileExists("index.html")) {
    const html = await readText("index.html");
    if (!html.includes("<!--@include nav-->")) {
      push(issues, {
        path: "index.html",
        type: "POLICY",
        reason: "nav must be injected via include (SSOT: registry/site.nav.json)",
        name: "NAV_MUST_BE_INCLUDED",
        severity: "FAIL",
      });
    }

    // 3) 禁止 inline handler（onclick 等）
    //    这是最典型的“越权腐蚀点”
    const hasInlineHandler = /\son[a-z]+\s*=\s*["']/i.test(html);
    if (hasInlineHandler) {
      push(issues, {
        path: "index.html",
        type: "INLINE_HANDLER",
        reason: "inline event handler breaks runtime boundary; use addEventListener in runtime/*.js",
        name: "NO_INLINE_HANDLER",
        severity: "FAIL",
      });
    }

    // 4) inline style 先给 WARN（你可以后续升级为 FAIL）
    const hasInlineStyle = /\sstyle\s*=\s*["']/i.test(html);
    if (hasInlineStyle) {
      push(issues, {
        path: "index.html",
        type: "INLINE_STYLE",
        reason: "inline style should be moved into page css (assets/css/pages/*.page.css) where possible",
        name: "INLINE_STYLE_PRESENT",
        severity: "WARN",
      });
    }
  }

  // 5) replay.registry 双真源示例：只允许 assets/data/replay/ 下存在
  const bad = await fileExists("registry/replay.registry.json");
  if (bad) {
    push(issues, {
      path: "registry/replay.registry.json",
      type: "DUPLICATE_SOURCE",
      reason: "replay registry must be single-source under assets/data/replay/",
      name: "SSOT_REPLAY_REGISTRY",
      severity: "FAIL",
    });
  }

  // -----------------------------
  // 报告生成 & 写入
  // -----------------------------
  const rep = buildReport({
    title: "SynOSX Site · Structure Verification Report",
    issues,
    fallback: { pkg: "synosx-site" },
  });

  payload.ok = rep.summary.ok;
  payload.issues = rep.issues;
  payload.summary = rep.summary;

  await writeReportFile({ outPath: REPORT_MD, markdown: rep.markdown });

  // ✅ 制度段落 2/2
  await rcFinalize(payload);

  // ✅/❌ CLI 统一输出（你指定的模板）
  if (payload.ok)
    console.log(`✅ ${NAME} 校验通过 —— 说明：站点结构合宪（无 FAIL），详见 ${REPORT_MD}`);
  else
    console.log(`❌ ${NAME} 校验失败 —— 详情见 ${REPORT_MD}。`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
