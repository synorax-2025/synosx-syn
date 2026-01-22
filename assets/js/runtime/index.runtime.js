/* index.runtime.js — index-only runtime (FloatLog v1.1 aligned) */

(function indexRuntime(){
  function FL(){ return window.SXFloatLog || null; }

  function auditOpen(){
    const f = FL();
    if (!f) return null;
    f.open();
    return f;
  }

  function auditClear(){
    const f = FL();
    if (!f) return;
    f.clear();
  }

  function auditLine(msg, muted=false){
    const f = auditOpen();
    if (!f) return;
    f.append({ mark: ">", text: String(msg ?? ""), muted: !!muted });
  }

  // ----------------------------
  // Audit simulation (index-only)
  // ----------------------------
  function runAuditSimulation() {
    const pulse = document.getElementById('trace-pulse');
    const f = auditOpen();
    if (!f || !pulse) return;

    // ✅ FloatLog v1.1 API: setTitle(text) only
    f.setTitle("AUDIT ENGINE");
    f.clear();

    // ✅ “ANALYZING…” as muted first line (instead of subtitle param)
    auditLine("ANALYZING…", true);
    if (typeof f.hr === "function") f.hr();

    // pulse on
    pulse.style.background = "#3b82f6";
    pulse.style.boxShadow = "0 0 15px #3b82f6";

    const logs = [
      "IDENTIFYING TRACE: rc_2026-01-12...0001",
      "FETCHING INTENT: [EXPORT_BILLING_DATA]",
      "VERIFYING DAG CONSTITUTION... OK",
      "CONSULTING FIREWALL (S2)... GRANTED",
      "RECORDING EVIDENCE (S3)... HASHED",
      "EXECUTION BY BUSINESS_MODULE... DONE",
      "GENERATE AUDIT REPORT... SUCCESS"
    ];

    let i = 0;
    const timer = setInterval(() => {
      // ✅ FloatLog v1.1 API: append({mark,text,muted})
      auditLine(logs[i], false);
      i++;
      if (i >= logs.length){
        clearInterval(timer);
        setTimeout(() => {
          // 不强制 dock（你想继续看就留着）
          pulse.style.background = "#4ade80";
          pulse.style.boxShadow = "0 0 10px #4ade80";
        }, 900);
      }
    }, 420);
  }
  window.runAuditSimulation = runAuditSimulation;

  // ----------------------------
  // DAG view switch (index-only)
  // ----------------------------
  (function dagViewSwitch(){
    const btnTerminal = document.getElementById("btn-terminal");
    const btnConcept  = document.getElementById("btn-concept");
    const viewTerminal = document.getElementById("dag-terminal");
    const viewConcept  = document.getElementById("dag-concept");
    const label = document.getElementById("dag-view-label");
    if (!btnTerminal || !btnConcept || !viewTerminal || !viewConcept || !label) return;

    const apply = (mode) => {
      const isTerminal = mode === "terminal";
      viewTerminal.classList.toggle("active", isTerminal);
      viewConcept.classList.toggle("active", !isTerminal);
      btnTerminal.classList.toggle("active", isTerminal);
      btnConcept.classList.toggle("active", !isTerminal);
      btnTerminal.setAttribute("aria-selected", String(isTerminal));
      btnConcept.setAttribute("aria-selected", String(!isTerminal));
      label.textContent = isTerminal ? "TERMINAL" : "CONCEPT";

      auditLine(`DAG_VIEW_SWITCH -> ${isTerminal ? "TERMINAL" : "CONCEPT"}`, false);
      try { localStorage.setItem("sx_dag_view", mode); } catch {}
    };

    let saved = "terminal";
    try { saved = localStorage.getItem("sx_dag_view") || "terminal"; } catch {}
    (function applySilent(mode){
      const isTerminal = mode === "terminal";
      viewTerminal.classList.toggle("active", isTerminal);
      viewConcept.classList.toggle("active", !isTerminal);
      btnTerminal.classList.toggle("active", isTerminal);
      btnConcept.classList.toggle("active", !isTerminal);
      btnTerminal.setAttribute("aria-selected", String(isTerminal));
      btnConcept.setAttribute("aria-selected", String(!isTerminal));
      label.textContent = isTerminal ? "TERMINAL" : "CONCEPT";
    })(saved);

    btnTerminal.addEventListener("click", () => apply("terminal"));
    btnConcept.addEventListener("click",  () => apply("concept"));
  })();

  // ----------------------------
  // Replay jump (index-only)
  // ----------------------------
  (function bindReplayButton(){
    const btn = document.getElementById("btn-replay-trace");
    if (!btn) return;

    const trace = "rc_2026-01-12T0730Z_0001";
    btn.addEventListener("click", () => {
      auditLine(`REPLAY_REQUEST -> TRACE=${trace}`, false);
      auditLine("POLICY: index.html is ENTRY ONLY (no media playback).", true);
      auditLine("ROUTE -> replay.html (Audit Replay Runtime)", false);

      setTimeout(() => {
        window.location.href = `replay.html?trace=${encodeURIComponent(trace)}`;
      }, 320);
    });
  })();

  // ----------------------------
  // version badge (index-only)
  // ----------------------------
  (function patchVersionBadge(){
    const badge = document.getElementById("sx-version-badge");
    if (!badge) return;
    const v = (document.querySelector('meta[name="sx-version"]')?.getAttribute("content") || "").trim();
    if (v) badge.textContent = v;
  })();
})();
