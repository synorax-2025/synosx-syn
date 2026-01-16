/* sx.statusbar.js — shared statusbar runtime binder
   ✅ Auto-detect runtime (or meta sx-runtime)
   ✅ Auto-apply layout per runtime (INDEX / CASES / MANIFEST / REPLAY)
   ✅ Binds meta -> pills (build/version/commit/policy/runtime)
   ✅ REPLAY auto-fills trace from URL (?trace=...)
   ✅ Optional verdict dot id="sb-dot" (class: verified/blocked/unverified)
   ✅ Click-to-copy commit if commit pill has class "sb-copy"
   ✅ Shared API: window.SX_STATUSBAR.*
*/

(function sxStatusbarBoot(){
  "use strict";

  const $ = (id) => document.getElementById(id);

  // -----------------------------
  // Elements (optional-safe)
  // -----------------------------
  const elRuntime = $("sb-runtime");
  const elTraceA  = $("sb-trace");    // optional (some pages put trace in a button)
  const elTraceB  = $("sb-trace2");   // common in statusbar
  const elVerdict = $("sb-verdict");
  const elPolicy  = $("sb-policy");
  const elBuild   = $("sb-build");
  const elVersion = $("sb-version");
  const elCommit  = $("sb-commit");
  const elDot     = $("sb-dot");      // optional dot (engine-dot)

  const bar = document.querySelector(".statusbar");
  if (!bar && !elRuntime && !elTraceA && !elTraceB && !elVerdict && !elPolicy && !elBuild && !elVersion && !elCommit){
    return;
  }

  // -----------------------------
  // Meta helpers
  // -----------------------------
  const getMeta = (name) => {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? (el.getAttribute("content") || "") : "";
  };

  const getTraceFromUrl = () => {
    try{
      const sp = new URLSearchParams(location.search);
      return (sp.get("trace") || "").trim();
    }catch(_){
      return "";
    }
  };

  // -----------------------------
  // Runtime detection
  // -----------------------------
  function detectRuntime(){
    const forced = (getMeta("sx-runtime") || "").trim();
    if (forced) return forced.toUpperCase();

    const p = (location.pathname || "").toLowerCase();
    const file = p.split("/").pop() || "";

    if (file === "replay.html" || file.includes("replay")) return "REPLAY";
    if (file === "manifest.html" || file.includes("manifest") || file.includes("whitepaper")) return "MANIFEST";
    if (file === "cases.html" || file.includes("cases") || file.startsWith("case-")) return "CASES";
    return "INDEX";
  }

  function detectPolicy(){
    const v = (getMeta("sx-policy") || "").trim();
    return v || "DAG CONSTITUTION";
  }

  // -----------------------------
  // Layout governance (per runtime)
  // We only toggle pill visibility if the corresponding pill exists.
  // -----------------------------
  function setDisplay(el, on){
    if (!el) return;
    el.style.display = on ? "" : "none";
  }

  function findPillByValueEl(valueEl){
    if (!valueEl) return null;
    return valueEl.closest(".sb-pill");
  }

  const pillRuntime = findPillByValueEl(elRuntime);
  const pillTrace   = findPillByValueEl(elTraceB || elTraceA);
  const pillVerdict = findPillByValueEl(elVerdict);
  const pillPolicy  = findPillByValueEl(elPolicy);
  const pillBuild   = findPillByValueEl(elBuild);
  const pillVersion = findPillByValueEl(elVersion);
  const pillCommit  = findPillByValueEl(elCommit);

  function layoutFor(runtime){
    // defaults
    const show = {
      runtime: true,
      policy: true,
      build: true,
      version: true,
      commit: true,
      trace: false,
      verdict: false,
    };

    if (runtime === "REPLAY"){
      show.trace = true;
      show.verdict = true;
    }

    // MANIFEST/CASES/INDEX keep trace/verdict hidden by default
    return show;
  }

  function applyLayout(runtime){
    const r = String(runtime || "INDEX").toUpperCase();
    const show = layoutFor(r);

    setDisplay(pillRuntime, show.runtime);
    setDisplay(pillPolicy, show.policy);
    setDisplay(pillBuild, show.build);
    setDisplay(pillVersion, show.version);
    setDisplay(pillCommit, show.commit);
    setDisplay(pillTrace, show.trace);
    setDisplay(pillVerdict, show.verdict);
  }

  // -----------------------------
  // Bind initial values
  // -----------------------------
  const runtime = detectRuntime();
  if (elRuntime) elRuntime.textContent = runtime;

  const policy = detectPolicy();
  if (elPolicy) elPolicy.textContent = policy;

  const buildDate = (getMeta("sx-build-date") || "").trim();
  if (elBuild) elBuild.textContent = buildDate || "—";

  const version = (getMeta("sx-version") || "").trim();
  if (elVersion) elVersion.textContent = version || "—";

  const commit = (getMeta("sx-commit") || "").trim();
  if (elCommit) elCommit.textContent = commit || "—";

  // trace: only REPLAY auto-fills from URL, others show —
  if (elTraceA || elTraceB){
    const t = (runtime === "REPLAY") ? getTraceFromUrl() : "";
    const text = t ? t : "—";
    if (elTraceA) elTraceA.textContent = text;
    if (elTraceB) elTraceB.textContent = text;
  }

  // verdict: default UNRESOLVED unless meta overrides
  const presetVerdict = (getMeta("sx-verdict") || "").trim();
  if (elVerdict) elVerdict.textContent = presetVerdict ? presetVerdict.toUpperCase() : (elVerdict.textContent || "UNRESOLVED");

  applyLayout(runtime);

  // -----------------------------
  // Verdict dot governance
  // -----------------------------
  function setDot(mode){
    if (!elDot) return;
    const m = String(mode || "UNRESOLVED").toUpperCase();
    elDot.classList.remove("verified","blocked","unverified");
    if (m === "VERIFIED") elDot.classList.add("verified");
    else if (m === "BLOCKED") elDot.classList.add("blocked");
    else elDot.classList.add("unverified");
  }

  if (elVerdict) setDot(elVerdict.textContent);

  // -----------------------------
  // Click-to-copy commit (optional)
  // Only if commit pill has class sb-copy
  // -----------------------------
  async function copyText(text){
    const t = String(text || "");
    if (!t) return false;

    try{
      await navigator.clipboard.writeText(t);
      return true;
    }catch(_){
      try{
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      }catch(_2){
        return false;
      }
    }
  }

  if (pillCommit && pillCommit.classList.contains("sb-copy")){
    pillCommit.addEventListener("click", async () => {
      const ok = await copyText(elCommit ? elCommit.textContent : commit);
      if (!ok) return;
      // subtle feedback
      pillCommit.style.transform = "translateY(-1px)";
      setTimeout(() => { pillCommit.style.transform = ""; }, 140);
    });
  }

  // -----------------------------
  // Shared API (single source)
  // -----------------------------
  window.SX_STATUSBAR = window.SX_STATUSBAR || {};

  window.SX_STATUSBAR.applyLayout = (r) => {
    const t = String(r || "INDEX").toUpperCase();
    applyLayout(t);
  };

  window.SX_STATUSBAR.setRuntime = (r) => {
    const t = String(r || "INDEX").toUpperCase();
    if (elRuntime) elRuntime.textContent = t;
    applyLayout(t);
  };

  window.SX_STATUSBAR.setPolicy = (p) => {
    const t = (p || "").trim() || "DAG CONSTITUTION";
    if (elPolicy) elPolicy.textContent = t;
  };

  window.SX_STATUSBAR.setBuildDate = (d) => {
    const t = (d || "").trim() || "—";
    if (elBuild) elBuild.textContent = t;
  };

  window.SX_STATUSBAR.setVersion = (v) => {
    const t = (v || "").trim() || "—";
    if (elVersion) elVersion.textContent = t;
  };

  window.SX_STATUSBAR.setCommit = (c) => {
    const t = (c || "").trim() || "—";
    if (elCommit) elCommit.textContent = t;
  };

  window.SX_STATUSBAR.setTrace = (trace) => {
    const t = (trace || "").trim() || "—";
    if (elTraceA) elTraceA.textContent = t;
    if (elTraceB) elTraceB.textContent = t;
  };

  window.SX_STATUSBAR.setVerdict = (v) => {
    const t = String(v || "UNRESOLVED").trim().toUpperCase() || "UNRESOLVED";
    if (elVerdict) elVerdict.textContent = t;
    setDot(t);

    // If verdict is being used, we typically want REPLAY layout,
    // but we do NOT force runtime unless caller sets it.
  };

})();
