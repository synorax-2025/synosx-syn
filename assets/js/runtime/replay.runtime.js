/* runtime/replay.runtime.js — SynOSX Replay Runtime (page-only) (Frozen v1.0.2)
   - Loads assets/data/replay/replay.registry.json
   - Resolves trace -> entry
   - Renders meta + media
   - Logs via SXFloatLog (single authority)
   - Syncs Statusbar via window.SX_STATUSBAR (if present)
   - ✅ Context Pill: click to open/expand Audit Console (explicit entry)
*/

(function sxReplayRuntimeBoot(){
  "use strict";

  // ----------------------------
  // Config (root-safe)
  // ----------------------------
  const isInPages = location.pathname.includes("/pages/");
  const REGISTRY_PATH = (isInPages ? "../" : "") + "assets/data/replay/replay.registry.json";
  const REGISTRY_URL  = new URL(REGISTRY_PATH, location.href).toString();

  // ----------------------------
  // Helpers
  // ----------------------------
  const $ = (id) => document.getElementById(id);

  function FL(){ return window.SXFloatLog || null; }

  function auditOpen(){
    const f = FL();
    if (!f) return null;
    try{ f.open(); }catch(_){}
    return f;
  }

  function auditClear(){
    const f = FL();
    if (!f) return;
    try{ f.clear(); }catch(_){}
  }

  function auditHr(){
    const f = FL();
    if (!f || typeof f.hr !== "function") return;
    try{ f.hr(); }catch(_){}
  }

  function auditLine(msg, type="ok"){
    const f = auditOpen();
    if (!f) return;

    const t = String(msg ?? "");
    const isWarn = type === "warn";
    const isBad  = type === "bad";

    try{
      f.append({
        mark: isBad ? "✖" : isWarn ? "!" : "✓",
        text: t,
        muted: isWarn ? true : false
      });
    }catch(_){}
  }

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

  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function getTraceFromUrl(){
    try{
      const sp = new URLSearchParams(location.search);
      return (sp.get("trace") || "").trim();
    }catch(_){
      return "";
    }
  }

  function isProbablyTraceId(v){
    return typeof v === "string" && v.startsWith("rc_") && v.length <= 120;
  }

  function setStatusbarTrace(trace){
    try{ window.SX_STATUSBAR?.setTrace?.(trace); }catch(_){}
  }
  function setStatusbarVerdict(verdict){
    try{ window.SX_STATUSBAR?.setVerdict?.(verdict); }catch(_){}
  }
  function setStatusbarPolicy(policy){
    try{ window.SX_STATUSBAR?.setPolicy?.(policy); }catch(_){}
  }

  // ----------------------------
  // DOM refs
  // ----------------------------
  const elMeta     = $("meta-block");
  const chipStatus = $("chip-status");
  const chipMedia  = $("chip-media");
  const mediaNote  = $("media-note");
  const videoEl    = $("replay-video");

  const sbTrace   = $("sb-trace");
  const sbTrace2  = $("sb-trace2");
  const sbHash    = $("sb-hash");
  const sbVerdict = $("sb-verdict");

  const led1 = $("led-verdict");

  function setLedClass(mode){
    const all = ["verified","blocked","unverified"];
    if (!led1) return;
    all.forEach(c=>led1.classList.remove(c));
    led1.classList.add(mode);
  }

  function setVerdict(v){
    const vv = String(v || "UNRESOLVED").toUpperCase();

    if (sbVerdict) sbVerdict.textContent = vv;
    if (chipStatus) chipStatus.textContent = vv;

    setStatusbarVerdict(vv);

    if (vv === "VERIFIED") setLedClass("verified");
    else if (vv === "BLOCKED") setLedClass("blocked");
    else setLedClass("unverified");

    // chip style (optional)
    if (chipStatus){
      chipStatus.style.borderColor =
        (vv === "VERIFIED") ? "rgba(74,222,128,0.45)"
        : (vv === "BLOCKED") ? "rgba(250,204,21,0.45)"
        : "rgba(239,68,68,0.45)";

      chipStatus.style.background =
        (vv === "VERIFIED") ? "rgba(74,222,128,0.10)"
        : (vv === "BLOCKED") ? "rgba(250,204,21,0.10)"
        : "rgba(239,68,68,0.10)";

      chipStatus.style.color =
        (vv === "VERIFIED") ? "#bff7d6"
        : (vv === "BLOCKED") ? "#ffe9a8"
        : "#ffd2d2";
    }
  }

  async function loadRegistry(){
    const res = await fetch(REGISTRY_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`registry fetch failed: ${res.status}`);
    const json = await res.json();
    if (!json || typeof json !== "object") throw new Error("registry invalid: not object");
    if (!json.entries || typeof json.entries !== "object") throw new Error("registry invalid: entries missing");
    return json;
  }

  function clearVideo(){
    if (!videoEl) return;
    try{ videoEl.pause(); }catch(_){}
    videoEl.removeAttribute("poster");
    while(videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);
  }

  function renderUnverified(trace, reason){
    const t = trace || "—";

    if (sbTrace) sbTrace.textContent = t;
    if (sbTrace2) sbTrace2.textContent = t;

    if (sbHash) sbHash.textContent = "—";
    setStatusbarTrace(trace || "");
    setVerdict("UNVERIFIED");

    if (elMeta){
      elMeta.innerHTML = `<span class="muted">Trace 不存在或未被注册：</span>
<span class="kv">TRACE</span>: ${escapeHtml(trace || "(empty)")}
<br/><span class="muted">裁决：</span><span class="kv">REJECT PLAYBACK</span>
<br/><span class="muted">原因：</span>${escapeHtml(reason || "未找到可回放证据（不可创建事实，只能回放事实）。")}`;
    }

    if (chipMedia) chipMedia.textContent = "MEDIA: NONE";
    if (mediaNote){
      mediaNote.innerHTML = `<span class="chip">NOTE</span>
未找到对应回放载体。请检查 trace 是否正确，或把该 trace 写入 <b>${escapeHtml(REGISTRY_PATH)}</b>。`;
    }

    clearVideo();
  }

  function renderMeta(entry){
    const lines = [
      `<span class="kv">TRACE_ID</span>: ${escapeHtml(entry.trace_id)}`,
      `<span class="kv">INTENT</span>: ${escapeHtml(entry.intent)}`,
      `<span class="kv">ACTOR</span>: ${escapeHtml(entry.actor)}`,
      `<span class="kv">DAG</span>: ${escapeHtml(entry.dag)}`,
      `<span class="kv">FIREWALL</span>: ${escapeHtml(entry.firewall)}`,
      `<span class="kv">AUDIT</span>: ${escapeHtml(entry.audit)}`,
      `<span class="kv">VERDICT</span>: ${escapeHtml(entry.verdict)}`,
      `<span class="kv">EVIDENCE_HASH</span>: ${escapeHtml(entry.evidence_hash)}`,
      `<span class="kv">RECORDED_AT</span>: ${escapeHtml(entry.recorded_at)}`
    ];

    if (elMeta) elMeta.innerHTML = lines.join("<br/>");

    const trace = entry.trace_id || "";
    if (sbTrace) sbTrace.textContent = trace || "—";
    if (sbTrace2) sbTrace2.textContent = trace || "—";
    if (sbHash) sbHash.textContent = entry.evidence_hash || "—";

    setStatusbarTrace(trace);
    setVerdict(entry.verdict || "UNRESOLVED");
  }

  function renderMedia(entry){
    const m = entry.media;

    if (!m || !m.src){
      if (chipMedia) chipMedia.textContent = "MEDIA: NONE";
      if (mediaNote){
        mediaNote.innerHTML = `<span class="chip">NOTE</span>
该 trace 已注册，但未配置 <b>media.src</b>。请在 registry 里补全回放载体路径。`;
      }
      clearVideo();
      return;
    }

    if (chipMedia) chipMedia.textContent = `MEDIA: ${m.type || "video/mp4"}`;
    if (mediaNote){
      mediaNote.innerHTML = `<span class="chip">REPLAY</span>
<b>载体仅用于回放证据。</b> 若载体与 evidence_hash 不一致，应视为篡改风险并升级裁决。`;
    }

    if (!videoEl) return;

    while(videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);

    const toAbs = (p) => {
      if (!p) return "";
      const s = String(p);
      if (/^(https?:)?\/\//i.test(s)) return s;
      return new URL(s, location.href).toString();
    };

    if (m.poster) videoEl.setAttribute("poster", toAbs(m.poster));

    const src = document.createElement("source");
    src.src = toAbs(m.src);
    src.type = m.type || "video/mp4";
    videoEl.appendChild(src);
    videoEl.load();
  }

  async function runReplay(entry){
    auditOpen();
    auditClear();

    auditLine("ENTER REPLAY RUNTIME", "ok");
    auditLine(`PAGE: ${location.pathname}`, "warn");
    auditLine(`PROTO: ${location.protocol}`, "warn");
    auditHr();

    auditLine(`TRACE RESOLUTION: ${entry.trace_id}`, "ok");
    auditLine(`FETCH INTENT: [${entry.intent}]`, "ok");
    auditLine(`VERIFY DAG CONSTITUTION... ${entry.dag}`, entry.dag === "OK" ? "ok" : "warn");

    if (entry.firewall === "DENIED"){
      auditLine("CONSULT FIREWALL (S2)... DENIED", "warn");
      auditLine("REPLAY POLICY: BLOCKED TRACE IS STILL REPLAYABLE (EVIDENCE ONLY)", "ok");
      setStatusbarPolicy("AUDIT REPLAY CONSTITUTION · BLOCKED TRACE");
    }else{
      auditLine("CONSULT FIREWALL (S2)... GRANTED", "ok");
      setStatusbarPolicy("AUDIT REPLAY CONSTITUTION · GRANTED TRACE");
    }

    auditLine(`VERIFY AUDIT (S3)... ${entry.audit}`, "ok");
    auditLine(`EVIDENCE HASH: ${entry.evidence_hash}`, "ok");
    auditHr();

    const m = entry.media;
    if (!m || !m.src){
      auditLine("MEDIA: NONE (cannot play)", "bad");
      return;
    }

    // playback (may require gesture)
    try{
      await videoEl.play();
      auditLine("MEDIA PLAYBACK: START", "ok");
    }catch(_e){
      auditLine("MEDIA PLAYBACK: BLOCKED BY BROWSER (gesture required?)", "warn");
    }

    const onEnded = () => {
      auditLine("MEDIA PLAYBACK: END", "ok");
      auditLine("REPLAY COMPLETE", "ok");
      videoEl.removeEventListener("ended", onEnded);
    };
    videoEl.addEventListener("ended", onEnded);
  }

  // ----------------------------
  // Boot
  // ----------------------------
  (async function boot(){
    // back link adapt
    const back = $("lnk-back-index");
    if (back) back.href = isInPages ? "../index.html" : "index.html";

    // ✅ Context banner explicit entry: click -> open/expand audit console
    // You must set replay.html element id="replay-context-pill"
    (function bindContextPill(){
      const pill = $("replay-context-pill");
      if (!pill) return;

      // make it feel clickable even if it's a div
      pill.style.cursor = "pointer";
      pill.setAttribute("role", pill.getAttribute("role") || "button");
      pill.setAttribute("tabindex", pill.getAttribute("tabindex") || "0");
      pill.setAttribute("title", pill.getAttribute("title") || "Open Audit Console");

      const open = () => {
        const f = FL();
        if (!f) return;
        try{ f.open(); }catch(_){}
        // if your floatlog supports expand(), call it
        try{ f.expand?.(); }catch(_){}
      };

      pill.addEventListener("click", open);
      pill.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " "){
          e.preventDefault();
          open();
        }
      });
    })();

    setVerdict("UNVERIFIED");

    const trace = getTraceFromUrl();
    setStatusbarTrace(trace || "");

    if (!trace){
      renderUnverified("", "缺少 ?trace=... 参数。");
      return;
    }
    if (!isProbablyTraceId(trace)){
      renderUnverified(trace, "trace 格式不合法（必须以 rc_ 开头）。");
      return;
    }

    let registry;
    try{
      registry = await loadRegistry();
    }catch(e){
      auditOpen();
      auditClear();

      auditLine("AUDIT REPLAY RUNTIME", "ok");
      auditLine(`REGISTRY LOAD FAILED: ${REGISTRY_URL}`, "bad");
      auditLine(`PAGE: ${location.pathname}`, "warn");
      auditLine(`PROTO: ${location.protocol}`, "warn");
      auditLine(`ERROR: ${String(e?.message || e)}`, "warn");

      const isFile = (location.protocol || "") === "file:";
      renderUnverified(
        trace,
        isFile
          ? "你正在用 file:// 打开页面，浏览器禁止 fetch 本地 JSON。请用本地静态服务器或 GitHub Pages。"
          : "registry 加载失败（路径或服务器返回异常）。"
      );
      return;
    }

    const entry = registry.entries?.[trace];
    if (!entry){
      renderUnverified(trace, "registry 中未找到该 trace。");
      return;
    }

    entry.trace_id = entry.trace_id || trace;

    renderMeta(entry);
    renderMedia(entry);

    // Optional buttons (if present)
    const btnRun = $("btn-run-replay");
    if (btnRun) btnRun.addEventListener("click", () => runReplay(entry));

    const btnCopyTrace = $("btn-copy-trace");
    if (btnCopyTrace) btnCopyTrace.addEventListener("click", async () => {
      const ok = await copyText(entry.trace_id || trace);
      auditOpen();
      auditLine(ok ? `COPIED TRACE: ${entry.trace_id || trace}` : "COPY FAILED (TRACE)", ok ? "ok" : "warn");
    });

    const btnCopyHash = $("btn-copy-hash");
    if (btnCopyHash) btnCopyHash.addEventListener("click", async () => {
      const ok = await copyText(entry.evidence_hash || "");
      auditOpen();
      auditLine(ok ? `COPIED HASH: ${entry.evidence_hash}` : "COPY FAILED (HASH)", ok ? "ok" : "warn");
    });

    // Auto-run once (optional): uncomment if you want it to start immediately
    // runReplay(entry);
  })();
})();
