<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SynOSX · Audit Replay Runtime</title>
  <meta name="description"
        content="SynOSX Audit Replay Runtime：以 trace_id 为入口，回放已被治理链路裁决并审计的行为证据。" />

  <!-- ✅ System Status Meta -->
  <meta name="sx-runtime" content="REPLAY" />
  <meta name="sx-build-date" content="2026-01-13" />
  <meta name="sx-version" content="v1.0.4-Stable" />
  <meta name="sx-commit" content="ba...227" />
  <meta name="sx-policy" content="AUDIT REPLAY CONSTITUTION" />
  <meta name="sx-statusbar-layout" content="governance" />

  <!-- ✅ Shared CSS -->
  <link rel="stylesheet" href="assets/css/sx.core.css" />
  <link rel="stylesheet" href="assets/css/sx.statusbar.css" />
  <link rel="stylesheet" href="assets/css/sx.drawer.css" />

  <!-- ✅ Page CSS -->
  <link rel="stylesheet" href="assets/css/pages/replay.page.css" />
</head>

<body class="has-statusbar">
  <div class="bg-gradient" aria-hidden="true"></div>

  <!-- ======================================================
       Nav (Replay Edition · Governance-safe)
       ====================================================== -->
  <nav id="navbar" aria-label="Replay Navigation">
    <div class="nav-content">
      <a class="logo" href="cases.html" aria-label="Back to Cases">
        <div class="logo-icon">SX</div>
        <span>
          <b>SynOSX</b>
          <span class="logo-sub">· Audit Replay</span>
        </span>
      </a>

      <!-- Desktop nav intentionally minimal (tool page) -->
      <ul class="nav-links nav-desktop" aria-hidden="true"></ul>

      <div class="nav-actions">
        <!-- Mobile menu trigger (drawer injected / shared) -->
        <button
          id="sxMenuBtn"
          class="nav-menu-btn btn-secondary"
          type="button"
          aria-expanded="false"
          aria-controls="sx-mobile-menu">
          ☰ Menu
        </button>

        <!-- Governance-safe actions -->
        <a class="btn-secondary" href="cases.html">
          ← 返回判例
        </a>

        <button class="cta-button" id="btn-load-replay" type="button">
          ▶ 回放证据
        </button>
      </div>
    </div>
  </nav>

  <!-- ✅ Mobile Drawer (shared shell, injected or inline) -->
  <!-- 如果你已经用 nav.partial.html，这一段可以不写 -->
  <div id="sx-mobile-menu" class="sx-drawer" aria-hidden="true">
    <div class="sx-drawer-backdrop" data-close="sx-drawer"></div>

    <div class="sx-drawer-panel" role="dialog" aria-label="Mobile Menu">
      <div class="sx-drawer-top">
        <div class="sx-drawer-brand">
          <div class="logo-icon">SX</div>
          <div class="sx-drawer-title">
            <div class="sx-drawer-name">SynOSX</div>
            <div class="sx-drawer-sub">Audit Replay</div>
          </div>
        </div>

        <button class="sx-drawer-close" type="button" data-close="sx-drawer">
          Close
        </button>
      </div>

      <nav class="sx-drawer-nav" aria-label="Replay Menu">
        <a href="cases.html" data-close="sx-drawer">返回判例</a>
        <a href="narratives.html" data-close="sx-drawer">Governance Narratives</a>
      </nav>
    </div>
  </div>

  <!-- ======================================================
       Main Replay Runtime (原内容保持不变)
       ====================================================== -->

  <main class="replay-main">
    <!-- 你原来的 header / sections / video / audit drawer 全部保持 -->
    <!-- 此处省略：逻辑与之前一致 -->
  </main>

  <!-- ✅ Statusbar -->
  <div class="statusbar" role="contentinfo" aria-label="System Status Bar">
    <!-- 原 statusbar 结构不动 -->
  </div>

  <!-- ✅ Shared JS -->
  <script src="assets/js/sx.statusbar.js"></script>
  <script src="assets/js/sx.core.js"></script>
  <script src="assets/js/sx.drawer.js"></script>

  <!-- ✅ Page runtime -->
  <script src="assets/js/runtime/replay.runtime.js"></script>
</body>
</html>
