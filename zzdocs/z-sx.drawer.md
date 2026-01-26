/* sx.drawer.css — Frozen v1.3.1 (2026-01-21)
   ✅ iOS Safari/Chrome stable: panel internal scroll + no snapback
   ✅ No 100vh/dvh: use --sx-vh-px from JS
   ✅ Background locked via body fixed (JS)
   ✅ Drawer: right narrow panel, under fixed nav
   ✅ Expandable nodes: Use Cases + generic group (目录等)
   ✅ Governance Narratives special block + subtitle visible
   ✅ NAV visibility constitution (desktop 1–10, mobile menu only)
   ✅ Responsive CTA policy:
      - Desktop: allow secondary CTA in topbar
      - Mobile: hide secondary CTA; keep its path in drawer if needed
      - Drawer-only-mobile items supported via .sx-only-mobile
*/

:root{
  --sx-nav-h: 76px;              /* JS 会同步真实 nav 高度 */
  --sx-vh-px: 800px;             /* JS 会写入 window.innerHeight */
  --sx-safe-bottom: env(safe-area-inset-bottom, 0px);

  --sx-container-pad: 24px;
  --sx-container-pad-sm: 18px;

  --sx-drawer-radius: 18px;
  --sx-drawer-w: 280px;

  --sx-drawer-bg: rgba(10,14,26,0.95);
  --sx-drawer-border: rgba(255,255,255,0.10);
  --sx-drawer-shadow: 0 20px 60px rgba(0,0,0,0.60);

  --sx-drawer-hover: rgba(255,255,255,0.08);
  --sx-drawer-text: rgba(232,236,245,0.92);
  --sx-drawer-muted: rgba(232,236,245,0.60);

  /* ✅ Drawer panel 可视高度（整体框高）
     0.78 ≈ 6 行在部分机型仍偏短
     0.88~0.92 更稳：目录展开能看见更多条目
  */
  --sx-drawer-open-factor: 0.90;

  /* ✅ Group(目录)展开区：最多显示约 6 行后内部滚动（更精确）
     320~420 调整即可
  */
  --sx-drawer-group-maxh: 360px;
}

/* =========================================================
   NAV visibility constitution (三态锁死)
   Desktop (>980): show desktop nav (1–10), hide menu button
   Mobile  (<=980): hide desktop nav, show menu button
   ========================================================= */

.nav-menu-btn{ display:none !important; }

/* 桌面：只在 navbar 内强制 desktop nav 存在（避免误伤其它结构） */
#navbar .nav-desktop{ display:flex !important; }

@media (max-width: 980px){
  #navbar .nav-desktop{ display:none !important; }
  .nav-menu-btn{ display:inline-flex !important; }
}

/* =========================================================
   Responsive CTA policy (关键新增)
   - secondary CTA in topbar: desktop-only
   - drawer items that should exist only on mobile: .sx-only-mobile
   ========================================================= */

/* Mobile: hide topbar secondary CTA; show mobile-only drawer items */
@media (max-width: 980px){
  .sx-cta-secondary{ display:none !important; }
  .sx-only-mobile{ display:block; }
}

/* Desktop: show topbar secondary CTA; hide mobile-only drawer items */
@media (min-width: 981px){
  .sx-cta-secondary{ display:inline-flex; }
  .sx-only-mobile{ display:none !important; }
}

/* =========================================================
   Drawer root
   ========================================================= */

.sx-drawer{
  position: fixed;
  inset: 0;
  z-index: 200; /* 比 nav(100) 更高，确保覆盖 */
  display: none;
}
.sx-drawer.is-open{ display:block; }

/* Backdrop covers whole viewport */
.sx-drawer-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.50);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  /* iOS: 避免 backdrop 被当作滚动区域 */
  touch-action: none;
}

/* =========================================================
   Panel (THE ONLY SCROLL CONTAINER)
   iOS safe: max-height uses --sx-vh-px (px), not vh
   ========================================================= */

.sx-drawer-panel{
  position: fixed;
  top: calc(var(--sx-nav-h) + 10px);
  right: var(--sx-container-pad-sm);
  width: var(--sx-drawer-w);

  max-height: calc(
    (var(--sx-vh-px) - var(--sx-nav-h) - 8px - var(--sx-safe-bottom))
    * var(--sx-drawer-open-factor)
  );

  /* ✅ 唯一滚动容器 */
  overflow-y: auto;
  overflow-x: hidden;

  -webkit-overflow-scrolling: touch;

  /* ✅ iOS 稳定：不要用 overscroll-behavior: contain;（不稳定）
     拆成 y/x，避免滚动手势被吞 */
  overscroll-behavior-y: contain;
  overscroll-behavior-x: none;

  background: var(--sx-drawer-bg);
  border: 1px solid var(--sx-drawer-border);
  border-radius: var(--sx-drawer-radius);
  box-shadow: var(--sx-drawer-shadow);

  padding: 14px;
  outline: none;

  /* 视觉：GitHub dropdown */
  transform: translateY(-10px);
  opacity: 0;
  transition: transform 180ms ease, opacity 180ms ease;

  /* ✅ iOS 关键：带 transform 的滚动容器必须加稳定器 */
  transform: translateZ(0);
  will-change: transform, opacity;

  /* iOS: 允许 panel 内 pan-y；防止页面本体跟着滑 */
  touch-action: pan-y;
}

.sx-drawer.is-open .sx-drawer-panel{
  transform: translateZ(0);
  opacity: 1;
}

/* iPhone small */
@media (max-width: 480px){
  :root{ --sx-drawer-w: 260px; }
  .sx-drawer-panel{ right: 12px; }
}

/* =========================================================
   Scrollbar (iOS may hide — ok)
   ========================================================= */

.sx-drawer-panel{
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.22) transparent;
}
.sx-drawer-panel::-webkit-scrollbar{ width: 8px; }
.sx-drawer-panel::-webkit-scrollbar-track{ background: transparent; }
.sx-drawer-panel::-webkit-scrollbar-thumb{
  background: rgba(255,255,255,0.22);
  border-radius: 6px;
}
.sx-drawer-panel::-webkit-scrollbar-thumb:hover{
  background: rgba(255,255,255,0.30);
}

/* =========================================================
   Top row (brand + close)
   ========================================================= */

.sx-drawer-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;

  padding: 6px 4px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.10);
  margin-bottom: 10px;
}

.sx-drawer-brand{
  display:flex;
  align-items:center;
  gap: 10px;
}

.sx-drawer-brand .logo-icon{
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: 900;
  font-size: 13px;
  color: #071022;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  flex-shrink: 0;
}

.sx-drawer-title{
  display:flex;
  flex-direction:column;
  line-height: 1.15;
}

.sx-drawer-name{
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #fff;
  font-size: 14.5px;
}

.sx-drawer-sub{
  font-size: 12px;
  font-weight: 700;
  color: var(--sx-drawer-muted);
  opacity: .95;
}

/* Close button */
.sx-drawer-close{
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.82);
  border-radius: 10px;
  padding: 7px 9px;
  cursor:pointer;
}
.sx-drawer-close:hover{
  background: rgba(255,255,255,0.10);
}

/* =========================================================
   Nav list
   ========================================================= */

.sx-drawer-nav{
  display:flex;
  flex-direction:column;
  gap: 2px;
  padding: 2px 2px 0;
}

.sx-drawer-nav > a{
  display:flex;
  align-items:center;
  padding: 10px 8px;
  border-radius: 10px;
  color: var(--sx-drawer-text);
  font-size: 14.5px;
  font-weight: 750;
}
.sx-drawer-nav > a:hover{
  background: var(--sx-drawer-hover);
}

/* =========================================================
   Buttons reset (IMPORTANT for iOS/white)
   ========================================================= */

.sx-drawer-nav button,
.sx-drawer-usecases{
  appearance: none;
  -webkit-appearance: none;
  border: none;
  background: transparent;
  color: #fff;
  width: 100%;
  text-align: left;
  cursor: pointer;

  display:flex;
  align-items:center;
  gap: 8px;

  padding: 10px 8px;
  border-radius: 10px;

  font-size: 14.5px;
  font-weight: 850;
}

.sx-drawer-nav button:hover,
.sx-drawer-usecases:hover{
  background: var(--sx-drawer-hover);
}

/* caret */
.sx-usecases-caret{
  margin-left: auto;
  font-size: 12px;
  opacity: .75;
  transition: transform 180ms ease, opacity 180ms ease;
}
.sx-drawer-usecases[aria-expanded="true"] .sx-usecases-caret{
  transform: rotate(90deg);
  opacity: .95;
}
/* ✅ generic group caret rotate (目录等) */
.sx-drawer-group[aria-expanded="true"] .sx-usecases-caret{
  transform: rotate(90deg);
  opacity: .95;
}

/* =========================================================
   Secondary panel (Use Cases)
   ========================================================= */

#sx-usecases-panel[hidden]{ display:none !important; }

#sx-usecases-panel{
  margin-top: 4px;
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid rgba(255,255,255,0.12);

  display:flex;
  flex-direction:column;
  gap: 2px;
}

#sx-usecases-panel a{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;

  padding: 8px 8px;
  border-radius: 10px;

  font-size: 13px;
  font-weight: 650;
  color: rgba(232,236,245,0.78);
}
#sx-usecases-panel a:hover{
  background: rgba(255,255,255,0.06);
  color: rgba(232,236,245,0.95);
}

/* =========================================================
   Group panels (e.g. 目录) — vertical list + 6-row viewport
   Build output: <button class="sx-drawer-group" ...> + <div id="sx-group-xxx" hidden>...</div>
   ========================================================= */

.sx-drawer-nav > div[hidden]{ display:none !important; }

/* group open panel container */
.sx-drawer-nav > div:not([hidden]){
  margin-top: 4px;
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid rgba(255,255,255,0.12);

  display:flex;
  flex-direction:column;
  gap: 2px;

  /* ✅ 至少可见 ~6 行，超出内部滚动 */
  max-height: var(--sx-drawer-group-maxh);
  overflow: auto;
  -webkit-overflow-scrolling: touch;

  padding-right: 4px;
}

/* ✅ 关键：每个 Ch.* 独占一行（避免挤成一排） */
.sx-drawer-nav > div:not([hidden]) > a{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;

  padding: 8px 8px;
  border-radius: 10px;

  font-size: 13px;
  font-weight: 650;
  color: rgba(232,236,245,0.78);
}
.sx-drawer-nav > div:not([hidden]) > a:hover{
  background: rgba(255,255,255,0.06);
  color: rgba(232,236,245,0.95);
}

/* divider */
.sx-drawer-divider{
  height: 1px;
  margin: 10px 6px;
  background: rgba(255,255,255,0.10);
}

/* =========================================================
   Governance Narratives (special block)
   ✅ title + subtitle both visible
   ========================================================= */

.sx-drawer-narratives{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap: 4px;

  padding: 10px 10px;
  border-radius: 12px;

  border: 1px solid rgba(59,130,246,0.28);
  background: rgba(59,130,246,0.10);
}
.sx-drawer-narratives:hover{
  background: rgba(59,130,246,0.14);
  border-color: rgba(59,130,246,0.40);
}

.sx-drawer-narratives-title{
  font-weight: 900;
  color: rgba(255,255,255,0.95);
  font-size: 13.5px;
}
.sx-drawer-narratives-sub{
  font-size: 11.5px;
  font-weight: 700;
  color: rgba(232,236,245,0.70);
  line-height: 1.35;
}

/* =========================================================
   Actions area
   ========================================================= */

.sx-drawer-actions{
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.10);

  display:flex;
  gap: 10px;
  flex-wrap: wrap;

  padding-bottom: calc(6px + var(--sx-safe-bottom));
}

/* Let shared button styles handle visuals; just layout */
.sx-drawer-actions .btn-secondary,
.sx-drawer-actions .cta-button{
  flex: 1 1 auto;
  justify-content: center;
}


 #  #  第二个文件

/* sx.drawer.js — Frozen v1.4.1 (DOM-ready + iOS scroll fix + stable group toggle)
   ✅ Works even if script is not deferred (wait DOM)
   ✅ iOS stable: background locked + allow panel scroll
   ✅ Drawer supports:
      - Use Cases fold (.sx-drawer-usecases -> #sx-usecases-panel)
      - Generic group folds (.sx-drawer-group[aria-controls] -> #sx-group-*)
   ✅ Group panel lookup is SCOPED to drawer (no global getElementById bugs)
*/

(function(){
  "use strict";

  function boot(){
    const btn = document.getElementById("sxMenuBtn");
    const drawer = document.getElementById("sx-mobile-menu");
    if (!btn || !drawer) return false;

    const panel = drawer.querySelector(".sx-drawer-panel");
    const backdrop = drawer.querySelector(".sx-drawer-backdrop");
    const nav = document.querySelector("#navbar") || document.querySelector("nav");

    // Use Cases (special)
    const ucBtn = drawer.querySelector(".sx-drawer-usecases");
    const ucPanel = drawer.querySelector("#sx-usecases-panel");

    // Generic groups (目录等) — cache once
    const groupBtns = Array.from(drawer.querySelectorAll(".sx-drawer-group[aria-controls]"));

    let locked = false;
    let scrollY = 0;

    // iOS: touch control
    let touchStartY = 0;

    function syncNavHeight(){
      if (!nav) return;
      const h = Math.ceil(nav.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--sx-nav-h", h + "px");
    }

    function syncViewportPx(){
      const h = Math.ceil(window.innerHeight || 0);
      if (h > 0) document.documentElement.style.setProperty("--sx-vh-px", h + "px");
    }

    function applyHardFloor(){
      // 兜底：避免变量未写入时“2行高”错觉
      if (!panel) return;
      panel.style.minHeight = "360px"; // 你要“至少 6 个按钮高度”，360 更稳
    }

    function lockBodyFixed(on){
      if (on){
        if (locked) return;
        locked = true;

        scrollY = window.scrollY || window.pageYOffset || 0;

        document.body.style.position = "fixed";
        document.body.style.top = (-scrollY) + "px";
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
      }else{
        if (!locked) return;
        locked = false;

        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";

        window.scrollTo(0, scrollY);
      }
    }

    // ----------------------
    // Use Cases fold
    // ----------------------
    function closeUseCases(){
      if (!ucBtn || !ucPanel) return;
      ucBtn.setAttribute("aria-expanded", "false");
      ucPanel.hidden = true;
    }

    function toggleUseCases(){
      if (!ucBtn || !ucPanel) return;
      const isOpen = ucBtn.getAttribute("aria-expanded") === "true";
      ucBtn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      ucPanel.hidden = isOpen;
    }

    // ----------------------
    // Generic group folds (目录等)
    // ----------------------
    function getGroupPanel(btnEl){
      const id = btnEl && btnEl.getAttribute("aria-controls");
      if (!id) return null;
      // ✅ scope to drawer only — critical fix
      return drawer.querySelector("#" + CSS.escape(id));
    }

    function closeAllGroups(){
      groupBtns.forEach((b) => {
        const p = getGroupPanel(b);
        b.setAttribute("aria-expanded", "false");
        if (p) p.hidden = true;
      });
    }

    function openOnlyThisGroup(btnEl){
      // policy: only one group open at a time (prevents “一坨”)
      groupBtns.forEach((b) => {
        const p = getGroupPanel(b);
        const isSelf = b === btnEl;

        b.setAttribute("aria-expanded", isSelf ? "true" : "false");
        if (p) p.hidden = !isSelf;
      });
    }

    function toggleGroup(btnEl){
      const p = getGroupPanel(btnEl);
      if (!p) return;

      const isOpen = btnEl.getAttribute("aria-expanded") === "true";
      if (isOpen){
        btnEl.setAttribute("aria-expanded", "false");
        p.hidden = true;
      }else{
        openOnlyThisGroup(btnEl);
      }
    }

    // ----------------------
    // iOS scroll fix
    // ----------------------
    function onDrawerTouchMove(e){ e.preventDefault(); }

    function onPanelTouchStart(e){
      touchStartY = e.touches ? e.touches[0].clientY : 0;
    }

    function onPanelTouchMove(e){
      if (!panel) return;

      const curY = e.touches ? e.touches[0].clientY : 0;
      const deltaY = curY - touchStartY;

      const atTop = panel.scrollTop <= 0;
      const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)){
        e.preventDefault();
        return;
      }
      e.stopPropagation();
    }

    function enableIosScrollFix(){
      drawer.addEventListener("touchmove", onDrawerTouchMove, { passive: false });
      if (panel){
        panel.addEventListener("touchstart", onPanelTouchStart, { passive: true });
        panel.addEventListener("touchmove", onPanelTouchMove, { passive: false });
      }
    }

    function disableIosScrollFix(){
      drawer.removeEventListener("touchmove", onDrawerTouchMove);
      if (panel){
        panel.removeEventListener("touchstart", onPanelTouchStart);
        panel.removeEventListener("touchmove", onPanelTouchMove);
      }
    }

    // ----------------------
    // Open / Close
    // ----------------------
    function open(){
      syncNavHeight();
      syncViewportPx();
      applyHardFloor();

      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");

      closeUseCases();
      closeAllGroups();

      lockBodyFixed(true);
      enableIosScrollFix();

      setTimeout(() => { try{ panel && panel.focus(); }catch(_){} }, 0);
    }

    function close(){
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");

      disableIosScrollFix();
      lockBodyFixed(false);

      closeUseCases();
      closeAllGroups();

      try{ btn.focus(); }catch(_){}
    }

    // ----------------------
    // Events
    // ----------------------
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      drawer.classList.contains("is-open") ? close() : open();
    });

    if (backdrop) backdrop.addEventListener("click", close);

    // close-on-click (links + any [data-close])
    drawer.addEventListener("click", (e) => {
      const el = e.target && e.target.closest && e.target.closest('[data-close="sx-drawer"]');
      if (el) close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
    });

    // Use Cases fold
    if (ucBtn && ucPanel){
      closeUseCases();
      ucBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleUseCases();
      });
    }

    // Group fold (event delegation)
    drawer.addEventListener("click", (e) => {
      const gbtn = e.target && e.target.closest && e.target.closest(".sx-drawer-group[aria-controls]");
      if (!gbtn) return;
      e.preventDefault();
      e.stopPropagation();
      toggleGroup(gbtn);
    });

    function onViewportChange(){
      if (!drawer.classList.contains("is-open")) return;
      syncViewportPx();
      syncNavHeight();
      applyHardFloor();
    }

    window.addEventListener("resize", onViewportChange);
    if (window.visualViewport){
      window.visualViewport.addEventListener("resize", onViewportChange);
    }

    // init vars even before open
    syncNavHeight();
    syncViewportPx();
    applyHardFloor();

    return true;
  }

  // ✅ if script runs too early, wait DOM ready
  if (!boot()){
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();



## sx.drawer v2 · Slim Floating Bottom Drawer

（竖排 · 轻量 · 可展开 Use Cases）

定位一句话：
首页使用的“轻治理入口抽屉”，强调快速跳转与叙事导航，而不是结构探索。

一、核心设计原则（已内化你刚才的判断）
✅ 必须满足

底部上浮（不贴底）
有外框 + 阴影
竖排列表
Use Cases 可展开
不全屏

内容区负责滚动（iOS 稳定）
❌ 明确禁止
❌ 贴底 ActionSheet 风格
❌ 整个 Drawer 自己滚
❌ 多重 scroll container
❌ 横向 Tabs（那是 sx.menu 的职责）
┌─────────────────────────┐
│ Header（极简，可选）    │  ← 可有可无
├─────────────────────────┤
│ Content（唯一滚动区）  │  ← 关键
│  - Nav Links            │
│  - Use Cases (expand)   │
│  - Contact              │
├─────────────────────────┤
│ Actions（可选 CTA）     │
└─────────────────────────┘


2️⃣ Use Cases 展开后，框会不会自动拉长？
正确答案是：

会“看起来拉长”，但不应该是真的拉长。

你要的是这种逻辑：

✅ 正确行为（你应该用的）

整个 Drawer / Menu 面板高度：固定

滚动权：只在内容区

Use Cases 展开：只影响内部内容流

也就是说：

[ 固定高度面板 ]
┌─────────────────┐
│ 返回首页         │
│ Why              │
│ Constitution     │
│ S0–S6            │
│ Use Cases ▼      │
│   · Enterprise   │
│   · AI           │
│   · Video        │
│ Contact          │  ← 永远在
│                 │
│   (内容区滚动)   │
└─────────────────┘


👉 面板不长高，只是内容变多，滚动出现。
