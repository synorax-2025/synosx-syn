# UI STANDARD — Mobile Topbar & Navigation Constitution

> SynOSX Frontend Governance · Mobile / Desktop Navigation Rules
>
> **Status:** Frozen · Constitution Level
> **Last Updated:** 2026-01-21
> **Scope:** Topbar · CTA · Menu (Drawer)

---

## 一、设计目标（Design Intent）

本规范用于约束 **SynOSX 站点的顶栏（Topbar）与菜单（Menu / Drawer）行为**，确保：

* 信息层级清晰
* 行为一致、可预测
* 不因页面增多而失控
* 不依赖个人记忆或“感觉正确”

本规范 **不是 UI 建议**，而是 **制度级约束**。

---

## 二、核心铁律（Non‑Negotiable Rules）

### 铁律 1：顶栏永远只允许 **1 个 Primary CTA**

* Mobile Topbar **只允许 1 个 CTA**
* Desktop Topbar **最多 2 个 CTA（Primary + Secondary）**
* 不存在“返回不算 CTA”的例外

> 只要是用户可以点击并触发页面跳转或动作的按钮，都属于 CTA。

---

### 铁律 2：Menu（Drawer）不是第二个 Topbar

* Menu 是 **路径集合 / 目录 / 次级动作容器**
* Menu 不与 Topbar 竞争注意力
* Menu 里的入口 **不得与 Topbar CTA 在同一端重复**

---

### 铁律 3：所有“返回类行为”都是导航，不是操作

包括但不限于：

* 返回首页
* 返回判例
* 返回目录
* 返回 Use Cases

这些行为：

* 在 Desktop：优先作为 **Secondary CTA**
* 在 Mobile：进入 **Menu（Drawer）**

---

## 三、Desktop / Mobile 行为分离

### Desktop（> 980px）

* 显示：

  * Brand
  * Desktop Nav Links
  * Primary CTA
  * （可选）Secondary CTA
* 不显示：

  * Drawer Menu

### Mobile（≤ 980px）

* 显示：

  * Brand
  * Menu Button
  * **仅 1 个 Primary CTA**
* 不显示：

  * Desktop Nav Links
  * Secondary CTA

> Secondary CTA **自动降级进 Menu**。

---

## 四、Single Source of Truth（非常重要）

### 唯一真源

* 顶栏 / Menu / CTA 的结构与行为
* **只能由 `site.nav.json` 定义**

禁止：

* 在 HTML 中临时加按钮
* 在 CSS 中“偷偷隐藏”逻辑
* 在 JS 中硬编码判断

---

## 五、Mobile 专属入口的制度化声明

### 问题背景

很多入口：

* 在 Desktop 已经存在 CTA
* 但在 Mobile 必须进入 Menu

如果不显式声明，未来一定会出现：

* 重复入口
* 冲突显示
* 行为混乱

---

### 制度级解决方案：`onlyOn`

所有 **只应在 Mobile Menu 出现的入口**，必须在 `site.nav.json` 中显式标注：

```json
{
  "label": "返回首页",
  "href": "index.html",
  "onlyOn": "mobile"
}
```

#### 适用对象（必须标注）

* 返回首页
* 返回判例
* 返回目录
* 返回 Use Cases

**前提条件：**

> 该行为在 Desktop 已经通过 CTA 提供。

---

## 六、禁止隐式规则

以下做法 **一律禁止**：

* 仅靠 `.sx-only-mobile` CSS 类
* 仅靠 media query 隐藏
* 仅靠 JS 判断 viewport

原因：

* 行为语义被藏在实现中
* 制度无法被阅读、校验、审计

---

## 七、校验优先（Validation First）

### Schema 要求

* `site.nav.json` **必须通过 JSON Schema 校验**
* 新增字段（如 `onlyOn`）必须：

  1. 先进入 schema
  2. 再进入实现

### 校验目标

* 防止字段拼写错误
* 防止遗漏 `onlyOn`
* 防止非法组合（如 button 却带 href）

---

## 八、最终裁决（Frozen Decision）

* Mobile 顶栏 = Brand + Menu + **1 个 Primary CTA**
* Desktop 顶栏 = Brand + Nav + Primary (+ Secondary)
* 所有返回类：

  * Desktop → Secondary CTA
  * Mobile → Menu（且必须标注 `onlyOn: mobile`）

> 本规则一经发布，视为 **SynOSX 前端导航宪法的一部分**。
> 后续调整必须同步更新：
>
> * `site.nav.json`
> * schema
> * 本文档

---

**End of Constitution**
