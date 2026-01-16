/* sx.statusbar.js — shared statusbar runtime binder */

(function sxStatusbarBoot(){
  const $ = (id) => document.getElementById(id);

  // ✅ 兼容不同页面的 id 命名
  const elRuntime = $("sb-runtime");
  const elTraceA  = $("sb-trace");   // 可选
  const elTraceB  = $("sb-trace2");  // 常用
  const elVerdict = $("sb-verdict");
  const elPolicy  = $("sb-policy");

  // 若页面没放 statusbar（例如某些纯跳转页），直接退出
  if (!elRuntime && !elTraceA && !elTraceB && !elVerdict && !elPolicy) return;

  const getMeta = (name) => {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? (el.getAttribute("content") || "") : "";
  };

  const getTraceFromUrl = () => {
    try{
      const sp = new URLSearchParams(location.search);
      return (sp.get("trace") || "").trim();
    }catch(e){
      return "";
    }
  };

  // 运行时识别：可被 meta 覆盖
  function detectRuntime(){
    const forced = (getMeta("sx-runtime") || "").trim();
    if (forced) return forced;

    // ✅ 稳定一点：按“文件名”优先判断
    const p = (location.pathname || "").toLowerCase();
    const file = p.split("/").pop() || "";

    if (file === "replay.html" || file.includes("replay")) return "REPLAY";
    if (file === "manifest.html" || file.includes("manifest")) return "MANIFEST";
    if (file === "cases.html" || file.startsWith("case-") || file.includes("cases")) return "CASES";

    return "INDEX";
  }

  function detectPolicy(){
    const v = (getMeta("sx-policy") || "").trim();
    return v || "DAG CONSTITUTION";
  }

  // ✅ 写入 runtime / policy
  const runtime = detectRuntime();
  if (elRuntime) elRuntime.textContent = runtime;

  const policy = detectPolicy();
  if (elPolicy) elPolicy.textContent = policy;

  // ✅ trace：只有 REPLAY 才写，其它页保持 “—”
  if (elTraceA || elTraceB){
    const trace = (runtime === "REPLAY") ? getTraceFromUrl() : "";
    const text = trace ? trace : "—";
    if (elTraceA) elTraceA.textContent = text;
    if (elTraceB) elTraceB.textContent = text;
  }

  // ✅ verdict 默认不管：由页面自己写（replay 会动态改）
  // 但如果页面想静态写，也可以 meta 覆盖
  const presetVerdict = (getMeta("sx-verdict") || "").trim();
  if (presetVerdict && elVerdict) elVerdict.textContent = presetVerdict;

  // -------------------------------------------------
  // ✅ Shared API: 统一让页面调用，避免各页各写一套
  // -------------------------------------------------
  window.SX_STATUSBAR = window.SX_STATUSBAR || {};

  window.SX_STATUSBAR.setTrace = (trace) => {
    const t = (trace || "").trim() || "—";
    if (elTraceA) elTraceA.textContent = t;
    if (elTraceB) elTraceB.textContent = t;
  };

  window.SX_STATUSBAR.setPolicy = (p) => {
    const t = (p || "").trim() || "DAG CONSTITUTION";
    if (elPolicy) elPolicy.textContent = t;
  };

  window.SX_STATUSBAR.setRuntime = (r) => {
    const t = (r || "").trim() || "INDEX";
    if (elRuntime) elRuntime.textContent = t;
  };

  window.SX_STATUSBAR.setVerdict = (v) => {
    const t = (v || "").trim() || "UNRESOLVED";
    if (elVerdict) elVerdict.textContent = t;
  };
})();
