/* sx.statusbar.js — shared statusbar runtime binder */

(function sxStatusbarBoot(){
  const $ = (id) => document.getElementById(id);

  const elRuntime = $("sb-runtime");
  const elTrace   = $("sb-trace2");
  const elVerdict = $("sb-verdict");
  const elPolicy  = $("sb-policy");

  // 若页面没放 statusbar（例如某些纯跳转页），直接退出
  if (!elRuntime && !elTrace && !elVerdict && !elPolicy) return;

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

    const p = (location.pathname || "").toLowerCase();
    if (p.includes("replay")) return "REPLAY";
    if (p.includes("manifest")) return "MANIFEST";
    if (p.includes("cases")) return "CASES";
    return "INDEX";
  }

  function detectPolicy(){
    const v = (getMeta("sx-policy") || "").trim();
    return v || "DAG CONSTITUTION";
  }

  // ✅ 写入
  const runtime = detectRuntime();
  if (elRuntime) elRuntime.textContent = runtime;

  const policy = detectPolicy();
  if (elPolicy) elPolicy.textContent = policy;

  // ✅ replay 才写 trace，其它页保持 “—”
  if (elTrace){
    const trace = getTraceFromUrl();
    elTrace.textContent = trace ? trace : "—";
  }

  // ✅ verdict 默认不管：由页面自己写（replay 会动态改）
  // 但如果页面想静态写，也可以 meta 覆盖
  const presetVerdict = (getMeta("sx-verdict") || "").trim();
  if (presetVerdict && elVerdict) elVerdict.textContent = presetVerdict;

})();
