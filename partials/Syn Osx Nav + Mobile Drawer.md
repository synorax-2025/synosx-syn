# SynOSX Nav & Mobile Drawer Constitution

## —— Unified Frozen Version v1.0.1（唯一真源：JSON）

> **冻结版本**：v1.0.1
> **冻结日期**：2026-01-18
> **制定者**：Sayn × Seya
> **状态**：Frozen（结构级冻结，不允许临时偏离）

---
## Menu = 导航；返回 = 顶栏按钮，不进 Menu。
移动端顶栏固定三件套：
左：Logo
右：☰ Menu
右：主 CTA（随页面变化，比如“返回判例”或“预约技术对话”）
Menu 打开后只放：
Why / Constitution / S0–S6
Use Cases（可展开）
Contact
-（可选）Manifest / Whitepaper / Narratives 等

这样你的 Menu 永远干净，用户不会把“返回”当成目录项。
## 0. 本文档的裁决结论（先读）

* **Nav / Mobile Drawer 的唯一真源为：JSON Registry**
* `registry/site.nav.json` 是**制度级唯一真源**（Single Source of Truth）
* HTML / partial / JS **不得作为真源**，只能作为 **生成物或执行层**

> 本冻结用于永久解决：
>
> * 每页一套 Nav
> * 移动端顶栏失控
> * iOS 滚动异常
> * Whitepaper / Case / Replay 反复打补丁

---

## 1. 制度总览（Constitution Overview）

### 1.1 真源层级

```
registry/site.nav.json     ← 唯一制度真源（必须校验）
        ↓ (build)
partials/nav.partial.html  ← 生成模板 / 中间产物（禁止手改）
        ↓
dist/*.html                ← 发布物（只读）
```

* **JSON 决定一切结构与语义**
* 页面文件（`manifest.html / cases.html / replay.html`）

  * 只声明身份（pageKey）
  * 不得声明 Nav 结构

---

## 2. 目录与角色冻结

```text
synosx-site/
├─ registry/
│  └─ site.nav.json            # ⭐ Nav / Drawer 唯一真源（Frozen）
│
├─ partials/
│  └─ nav.partial.html         # 由 build 生成，不可手改
├─ tools/
│  └─ build-includes.mjs       # 构建执法者（读取 JSON → 注入）
│
└─ dist/                       # 发布目录（禁止手改）


```
synosx-site/
    assets/
├─ css/
│  ├─ pages/                 # 页面私有样式（视觉/布局）
│  │  ├─ index.page.css
│  │  ├─ manifest.page.css
│  │  ├─ replay.page.css
│  │  └─ ...
│  │
│  ├─ sx.core.css             # 全局基础（tokens / layout）
│  ├─ sx.drawer.css           # Drawer 冻结样式
│  └─ sx.statusbar.css
│
└─ js/
   ├─ runtime/               # 页面私有运行逻辑
   │  ├─ index.runtime.js
   │  ├─ replay.runtime.js
   │  └─ ...
   │
   ├─ sx.core.js
   ├─ sx.drawer.js            # Drawer 行为（开关 / 折叠 / 锁滚）
   ├─ sx.nav-config.js
   └─ sx.statusbar.js


---

## 3. JSON 真源规范（核心冻结）

### 3.1 site.nav.json 的职责

* 定义 **顶栏结构（Nav Bar）**
* 定义 **Mobile Drawer 结构**
* 定义 **页面差异（按 pageKey）**

JSON 是**唯一允许表达差异的地方**。

---

### 3.2 页面差异模型（替代 A / B / C）

原 A 文档中的 A/B/C 变量位，被**完整迁移**为 JSON 字段：

| 原变量位 | 新位置（JSON）                       | 说明           |
| ---- | ------------------------------- | ------------ |
| A    | `pages[pageKey].subtitle`       | Logo 右侧副标题   |
| B    | `pages[pageKey].cta`            | 顶栏唯一主 CTA    |
| C    | `pages[pageKey].drawerSubtitle` | Drawer 顶部上下文 |

> ❌ 页面 meta 中 **禁止再出现 Nav 语义变量**

---

## 4. 移动端顶栏（Frozen · 不可变更）

### 4.1 顶栏唯一结构

**移动端顶栏仅允许：**

* **左侧**

  * SynOSX Logo（允许两行）
  * 副标题（来自 JSON）

* **右侧**

  1. ☰ Menu
  2. **仅 1 个主 CTA（来自 JSON）**

### 4.2 永久禁止项

* 顶栏出现多个 CTA
* 顶栏直接出现导航链接（Use Cases / Manifest / Narratives）
* 为单个页面临时“多放一个按钮”

> **所有复杂度必须收敛进 Drawer**。

---

## 5. Mobile Drawer 冻结规范

### 5.1 结构冻结

* 普通一级链接（Primary）
* **唯一可展开节点：Use Cases**
* 必须存在的语义出口：

  * Governance Narratives
  * Non-normative, illustrative cases

### 5.2 滚动模型（不可破坏）

* 统一采用 **内部滚**
* 滚动只允许发生在 `.sx-drawer-panel`
* 外层 `.sx-drawer` 仅负责遮罩与层级

### 5.3 视觉克制

* 背景 **可见但不可读**
* 禁止纯黑遮罩
* 禁止背景文字抢焦

---

## 6. 页面侧硬规则

### 页面只允许做两件事

1. 声明 pageKey（由文件名 / build 规则确定）
2. 引入统一 JS / CSS

### 页面永久禁止

* 手写 Nav / Drawer DOM
* 通过 meta / JS / CSS hack 改 Nav 结构
* 根据页面条件渲染不同 Nav 布局

---

## 7. 构建与执法

### 7.1 构建职责

`tools/build-includes.mjs` 必须：

* 校验 `site.nav.json`
* 根据 pageKey 选择页面配置
* 生成 `nav.partial.html`
* 注入到 `dist/*.html`

### 7.2 发布规则

* **只发布 dist/**
* 源文件永不上线

---

## 8. 版本与升级规则

* 本文档为 **Frozen v1.0.1**
* 任何修改必须：

  * 新版本号（v1.1 / v2.0）
  * 明确升级说明

❌ 禁止：

* 临时 CSS / JS 打补丁
* 页面级例外

---

## 9. 最终裁决语

> 顶栏只负责：**识别 + 唯一主行动**
> 复杂度必须被制度收敛，而不是被页面消耗。

**自 2026-01-18 起生效。**

—— Seya
