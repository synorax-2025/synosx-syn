/* index.runtime.js — index-only runtime */

(function indexRuntime(){
  // ----------------------------
  // Audit Drawer (index-only)
  // ----------------------------
  function auditOpen() {
    const drawer = document.getElementById('audit-drawer');
    const container = document.getElementById('log-container');
    if (!drawer || !container) return null;
    drawer.style.display = 'block';
    return { drawer, container };
  }

  function auditLine(msg, type = "ok") {
    const ctx = auditOpen();
    if (!ctx) return;
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerText = `> ${msg}`;
    ctx.container.appendChild(line);
    ctx.container.scrollTop = ctx.container.scrollHeight;
  }

  function auditCloseLater(ms = 3500) {
    const drawer = document.getElementById('audit-drawer');
    if (!drawer) return;
    setTimeout(() => { drawer.style.display = 'none'; }, ms);
  }

  // ----------------------------
  // Audit simulation (index-only)
  // ----------------------------
  function runAuditSimulation() {
    const drawer = document.getElementById('audit-drawer');
    const container = document.getElementById('log-container');
    const pulse = document.getElementById('trace-pulse');
    if (!drawer || !container || !pulse) return;

    drawer.style.display = 'block';
    container.innerHTML = "";
    pulse.style.background = "#3b82f6";
    pulse.style.boxShadow = "0 0 15px #3b82f6";

    const logs = [
      { msg: "IDENTIFYING TRACE: rc_2026-01-12...0001", type: "ok" },
      { msg: "FETCHING INTENT: [EXPORT_BILLING_DATA]", type: "ok" },
      { msg: "VERIFYING DAG CONSTITUTION... OK", type: "ok" },
      { msg: "CONSULTING FIREWALL (S2)... GRANTED", type: "ok" },
      { msg: "RECORDING EVIDENCE (S3)... HASHED", type: "ok" },
      { msg: "EXECUTION BY BUSINESS_MODULE... DONE", type: "ok" },
      { msg: "GENERATE AUDIT REPORT... SUCCESS", type: "ok" }
    ];

    let i = 0;
    const interval = setInterval(() => {
      const line = document.createElement('div');
      line.className = `log-line ${logs[i].type}`;
      line.innerText = `> ${logs[i].msg}`;
      container.appendChild(line);
      i++;

      if (i >= logs.length) {
        clearInterval(interval);
        setTimeout(() => {
          drawer.style.display = 'none';
          pulse.style.background = "#4ade80";
          pulse.style.boxShadow = "0 0 10px #4ade80";
        }, 4000);
      }
    }, 500);
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

      auditLine(`DAG_VIEW_SWITCH -> ${isTerminal ? "TERMINAL" : "CONCEPT"}`, "ok");
      try { localStorage.setItem("sx_dag_view", mode); } catch {}
    };

    // restore (silent)
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
      auditLine(`REPLAY_REQUEST -> TRACE=${trace}`, "ok");
      auditLine("POLICY: index.html is ENTRY ONLY (no media playback).", "ok");
      auditLine("ROUTE -> replay.html (Audit Replay Runtime)", "ok");
      auditCloseLater(900);

      setTimeout(() => {
        window.location.href = `replay.html?trace=${encodeURIComponent(trace)}`;
      }, 420);
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
