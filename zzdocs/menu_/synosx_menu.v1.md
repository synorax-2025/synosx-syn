# SynOSX 顶栏 MENU 草稿设计方案  
_Desktop & Mobile · test-index.html 版本_

> 说明：这是当前 **测试版（草稿）实现** 的说明文档，  
> 暂时只在 `test-index.html` 中使用，还未完全接入 `site.nav.json` + schema 体系。  
> 目标是先把交互 / 手感跑顺，再逐步对齐《UI STANDARD — Mobile Topbar & Navigation Constitution》。:contentReference[oaicite:0]{index=0}

---

## 1. 顶栏结构总览（Desktop & Mobile 共用）

### 1.1 顶栏元素

- **Brand 区**
  - 左侧：SynOSX / Synorax 品牌文字（保持现有样式）
- **Primary CTA**
  - 右侧：例如 `Start` / `Get Manifest` 等主行动按钮（暂不在本文展开）
- **MENU 触发按钮**
  - 顶栏右上角 `MENU` 按钮（class：`sx-menu-trigger`）
  - 作用：打开结构导航面板（Chapters + S0–S6）

2. 总体目标

统一用一个 MENU 入口 管理：

目录（Chapters：Ch.1 ~ Ch.10）

SynOSX 层级（S0 ~ S6）

同一套 HTML 结构，通过 CSS + JS：

在 桌面端 表现为：右上角按钮下面的悬浮卡片；

在 移动端 表现为：从底部滑出的 Bottom Sheet。

不破坏现有 sx.core.css / SynOSX 视觉，作为一个独立可复用组件：

样式集中在 sx.menu.css

行为集中在 sx.menu.js

约定点：

data-sx-menu-open：打开菜单

data-sx-menu-close：点击关闭（X 按钮 + 背景）

data-sx-menu-tab="chapters" | "layers"：切换「目录 / S0–S6」

data-sx-menu-panel="chapters" | "layers"：对应的内容面板

3. 桌面端行为设计（Desktop）
3.1 触发位置 & 动画

MENU 按钮位于 顶栏右侧。

点击后：

.sx-menu-sheet 作为 overlay 显示（背景有轻微 blur + 暗色渐变）。

.sx-menu-sheet__panel：

定位：

top: 64px;（大约是 nav 高度 + 一点间距，可根据真实 nav 调整）

right: 24px;

left: auto; bottom: auto;

尺寸：

宽度：width: min(420px, calc(100vw - 48px));

高度：由内容撑开，max-height: 70vh;，多余部分内部滚动。

动画：

初始 transform: translateY(-8px);

打开时平滑到 translateY(0)，模拟「从 MENU 按钮下方轻轻掉下来」。

3.2 交互规则

点击 MENU：

.sx-menu-sheet 加上 .is-open。

点击：

右上角 × 按钮，或

背景层 .sx-menu-sheet__backdrop

→ 去掉 .is-open，菜单关闭。

Tab 行为：

点击「Chapters」→ 激活章节列表面板；

点击「SynOSX」→ 激活 S0–S6 层级面板；

通过 .sx-menu-sheet__tab--active 控制样式、高亮。

4. 手机端行为设计（Mobile）

触发仍然是同一个 MENU 按钮，但「手势习惯」完全不同。

4.1 Bottom Sheet 结构

在 @media (max-width: 640px) 下：

.sx-menu-sheet__panel：

仍然固定在底部：bottom: 0; left: 0; right: 0;

高度：height: 65vh; max-height: none; max-width: 100%;

圆角：border-radius: 18px 18px 0 0;

动画：

默认 transform: translateY(100%)（在屏幕下面）。

.sx-menu-sheet.is-open 时，transform: translateY(0)，从底部滑入。

4.2 手势和操作习惯

单手大拇指区域：

MENU 按钮可以在右上/左上，但实际操作主要是

关闭：点击底部 sheet 顶部的 ×

滚动：内容区域内上下滑动浏览章节 / S0–S6。

背景点击关闭：

点击 sheet 外的暗色背景区域也会关闭（更贴近系统底部弹窗逻辑）。

内容区滚动：

.sx-menu-sheet__body 设置 overflow: auto;

长章节 / 全部 S0–S6 列表也不会撑爆屏幕，而是内部滚动。

5. 视觉与结构分层（SynOSX 思想映射）
层级	对应元素	职责
S0	.sx-menu-sheet	Overlay 外壳、遮罩、安全边界
S1	.sx-menu-sheet__tabs	意图选择：章节 vs 层级
S2	data-sx-menu-*	行为协议（open/close/tab/panel）
S3	.sx-menu-sheet__body	可追溯滚动区域，未来可挂审计
S4	Chapters/Layers 文本	领域辞典（章节名、S0–S6 含义）
S5	跳转逻辑（JS 回调）	语义 → 滚动 / 跳 anchor
S6	未来：Seya / SynOSX 调用	通过 Intent 触发此 MENU 组件
6. JS 行为契约（简述）

你现在的 sx.menu.js 只需要做三件事：

打开 / 关闭

监听 [data-sx-menu-open] 点击 → 给 .sx-menu-sheet 加 .is-open

监听 [data-sx-menu-close] 点击 → 去掉 .is-open

切换 Tab

监听 [data-sx-menu-tab]：

切换 .sx-menu-sheet__tab--active

显示对应 [data-sx-menu-panel="chapters" | "layers"]

回调跳转（预留）

Chapters 列表点击时：

调用一个 scrollToChapter("ch.03") 等函数（你以后实现）

Layers 列表点击时：

调用 scrollToLayer("S2") 或触发 SynOSX 内部意图导航。

7. 桌面 vs 手机 —— 行为对照一眼看清
维度	桌面端	手机端
打开样式	右上 MENU 下方悬浮卡片	屏幕底部滑出的 Bottom Sheet
面板位置	top: 64px; right: 24px; width ≈ 420px	bottom: 0; height: 65vh; width: 100%
动画方向	轻微下落（translateY(-8px) → 0）	自下而上（translateY(100%) → 0）
关闭方式	X 按钮 + 点击背景	X 按钮 + 点击背景
内容高度	max-height: 70vh + 内部滚动	固定 65vh + 内部滚动
操作重心	鼠标点击 + 精确选择章节 / S 层	拇指滑动 + 快速浏览 +点击章节/S 层