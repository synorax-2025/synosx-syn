/* sx.statusbar.js — SynOSX shared statusbar (auto layout switch)
   - Injects DOM (no per-page HTML needed)
   - Auto chooses layout by page type
   - Reads meta: sx-runtime, sx-build-date, sx-version, sx-commit, sx-policy
   - Optional override meta: sx-statusbar-layout = release|governance
*/

(function sxStatusbarBoot(){
  const getMeta = (name) => {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? (el.getAttribute("content") || "").trim() : "";
  };

  const safeText = (v, fallback = "—") => (String(v || "").trim() || fallback);

  const getTraceFromUrl = () => {
    try{
      const sp = new URLSearchParams(location.search);
      return (sp.get("trace") || "").trim();
    }catch(e){
      return "";
    }
  };

  function detectRuntime(){
    // explicit meta wins
    const forced = getMeta("sx-runtime");
    if (forced) return forced.toUpperCase();

    const p = (location.pathname || "").toLowerCase();
    const file = (p.split("/").pop() || "").toLowerCase();

    if (file === "replay.html" || file.includes("replay")) return "REPLAY";
    if (file === "manifest.html" || file.includes("manifest")) return "MANIFEST";
    if (file === "whitepaper.html" || file.includes("whitepaper")) return "WHITEPAPER";
    if (file === "cases.html" || file.startsWith("case-") || file.includes("cases")) return "CASES";

    return "INDEX";
  }

  function detectLayout(runtime){
    // meta override wins
    const forced = getMeta("sx-statusbar-layout").toLowerCase();
    if (forced === "release" || forced === "governance") return forced;

    // auto rule: replay/cases => governance; others => release
    if (runtime === "REPLAY" || runtime === "CASES") return "governance";
    return "release";
  }

  function detectPolicy(){
    return safeText(getMeta("sx-policy"), "DAG CONSTITUTION");
  }

  const runtime = detectRuntime();
  const layout = detectLayout(runtime);

  const build = safeText(getMeta("sx-build-date"), "unknown");
  const version = safeText(getMeta("sx-version"), "unknown");
  const commit = safeText(getMeta("sx-commit"), "unknown");
  const policy = detectPolicy();

  // -----------------------------
  // DOM inject
  // -----------------------------
  function pillHTML(key, val, opts = {}){
    const cls = ["sb-pill"];
    if (opts.copy) cls.push("sb-copy");
    const id = opts.id ? ` id="${opts.id}"` : "";
    const title = opts.title ? ` title="${opts.title}"` : "";
    const extra = opts.extraHTML || "";
    const keyHTML = key ? `<span class="sb-key">${key}</span>` : "";
    const valId = opts.valId ? ` id="${opts.valId}"` : "";
    const valHTML = `<span class="sb-val"${valId}>${val}</span>`;
    return `<span class="${cls.join(" ")}"${id}${title}>${keyHTML}${valHTML}${extra}</span>`;
  }

  function enginePill(){
    return `
      <span class="sb-pill">
        <span class="engine-dot" aria-hidden="true"></span>
        <span class="sb-key">ENGINE</span>
        <span class="sb-val">ACTIVE</span>
      </span>
    `.trim();
  }

  function policyPill(linkHref){
    // release: allow link; governance: treat as evidence text
    if (linkHref){
      return `
        <span class="sb-pill">
          <span class="sb-muted">Policy:</span>
          <a class="sb-link" href="${linkHref}">${policy}</a>
        </span>
      `.trim();
    }
    return pillHTML("POLICY", policy, { valId: "sb-policy" });
  }

  function commitPill(){
    // copy pill, unified
    return `
      <span class="sb-pill sb-copy" id="sb-commit-pill" title="Click to copy commit fingerprint">
        <span class="sb-key">COMMIT</span>
        <span class="sb-val" id="sb-commit">${commit}</span>
        <span class="sb-muted" id="sb-commit-hint">⧉</span>
      </span>
    `.trim();
  }

  function releaseLayoutHTML(){
    // matches your earlier “前面的”语义
    return `
      <div class="statusbar" role="contentinfo" aria-label="System Status Bar" data-sx-layout="release">
        <div class="statusbar-inner">
          <div class="sb-left">
            ${enginePill()}
            ${pillHTML("BUILD", build, { valId: "sb-build" })}
            ${pillHTML("VERSION", version, { valId: "sb-version" })}
            ${commitPill()}
          </div>

          <div class="sb-right">
            ${pillHTML("MODE", "INTERNAL PREVIEW")}
            ${policyPill("#constitution")}
          </div>
        </div>
      </div>
    `.trim();
  }

  function governanceLayoutHTML(){
    // matches your “后面的”治理语义
    const trace = (runtime === "REPLAY") ? safeText(getTraceFromUrl(), "—") : "—";
    return `
      <div class="statusbar" role="contentinfo" aria-label="System Status Bar" data-sx-layout="governance">
        <div class="statusbar-inner">
          <div class="sb-left">
            <span class="sb-pill">
              <span class="engine-dot" aria-hidden="true"></span>
              <span class="sb-key">RUNTIME</span>
              <span class="sb-val" id="sb-runtime">${runtime}</span>
            </span>

            ${pillHTML("TRACE", trace, { valId: "sb-trace" })}
          </div>

          <div class="sb-right">
            ${pillHTML("POLICY", policy, { valId: "sb-policy" })}
            ${commitPill()}
            ${pillHTML("VERDICT", safeText(getMeta("sx-verdict"), "UNRESOLVED"), { valId: "sb-verdict" })}
          </div>
        </div>
      </div>
    `.trim();
  }

  function inject(){
    // prevent double-inject
    if (document.querySelector(".statusbar[data-sx-layout]")) return;

    const html = (layout === "governance") ? governanceLayoutHTML() : releaseLayoutHTML();
    document.body.insertAdjacentHTML("beforeend", html);
  }

  inject();

  // -----------------------------
  // Binder: fill meta -> dom
  // -----------------------------
  const elBuild   = document.getElementById("sb-build");
  const elVersion = document.getElementById("sb-version");
  const elCommit  = document.getElementById("sb-commit");
  const elPolicy  = document.getElementById("sb-policy");
  const elRuntime = document.getElementById("sb-runtime");
  const elTrace   = document.getElementById("sb-trace");
  const elVerdict = document.getElementById("sb-verdict");

  if (elBuild) elBuild.textContent = build;
  if (elVersion) elVersion.textContent = version;
  if (elCommit) elCommit.textContent = commit;
  if (elPolicy) elPolicy.textContent = policy;
  if (elRuntime) elRuntime.textContent = runtime;

  // governance trace rule: only REPLAY shows actual trace; others show "—"
  if (elTrace){
    const trace = (runtime === "REPLAY") ? safeText(getTraceFromUrl(), "—") : "—";
    elTrace.textContent = trace;
  }

  // verdict can be preset by meta (sx-verdict), default already filled
  const presetVerdict = getMeta("sx-verdict");
  if (presetVerdict && elVerdict) elVerdict.textContent = presetVerdict;

  // Commit copy behavior
  (function bindCopyCommit(){
    const pill = document.getElementById("sb-commit-pill");
    if (!pill) return;

    const hint = document.getElementById("sb-commit-hint");

    pill.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(commit);
        if (hint) hint.textContent = "COPIED";
        if (window.SX_STATUSBAR && typeof window.SX_STATUSBAR.onCopy === "function"){
          window.SX_STATUSBAR.onCopy({ ok: true, commit });
        }
        setTimeout(()=> { if (hint) hint.textContent = "⧉"; }, 1200);
      }catch(e){
        if (hint) hint.textContent = "COPY?";
        if (window.SX_STATUSBAR && typeof window.SX_STATUSBAR.onCopy === "function"){
          window.SX_STATUSBAR.onCopy({ ok: false, commit, error: String(e && e.message ? e.message : e) });
        }
        setTimeout(()=> { if (hint) hint.textContent = "⧉"; }, 1200);
      }
    });
  })();

  // -----------------------------
  // Shared API (stable surface)
  // -----------------------------
  window.SX_STATUSBAR = window.SX_STATUSBAR || {};

  window.SX_STATUSBAR.setTrace = (t) => {
    if (!elTrace) return;
    elTrace.textContent = safeText(t, "—");
  };

  window.SX_STATUSBAR.setPolicy = (p) => {
    // release layout has policy as link text in DOM without #sb-policy
    // governance layout uses #sb-policy
    const v = safeText(p, "DAG CONSTITUTION");
    if (elPolicy) elPolicy.textContent = v;

    // also update release policy link text if present
    const link = document.querySelector('.statusbar[data-sx-layout="release"] .sb-link');
    if (link) link.textContent = v;
  };

  window.SX_STATUSBAR.setRuntime = (r) => {
    if (!elRuntime) return;
    elRuntime.textContent = safeText(r, "INDEX");
  };

  window.SX_STATUSBAR.setVerdict = (v) => {
    if (!elVerdict) return;
    elVerdict.textContent = safeText(v, "UNRESOLVED");
  };

  // Optional hook for pages (e.g. index audit drawer) to listen commit copy
  // window.SX_STATUSBAR.onCopy = ({ok, commit}) => {}
})();
