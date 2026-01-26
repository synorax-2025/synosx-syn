SynOSX · System Drawer（竖排抽屉）设计规范

状态：Locked / 已定型
范畴：System-level Navigation（系统级入口）
说明：本文档用于约束 竖排抽屉（Drawer） 的结构与职责

一、设计定位（必须先说清）

System Drawer 不是网页菜单，也不是普通 UI 组件。

它是 SynOSX 的 系统级入口容器（SystemShell），
用于承载 结构化导航 + 系统语义入口。

明确区分两种体系
文件	设计方向	说明
sx.drawer.css 竖排抽屉	System Drawer（本文件讨论对象）
sx.menu.css	横排面板	Desktop / Top Menu（另一套体系）

二者 不是同一个组件的不同样式，而是 两种不同结构模型。

二、核心结构模型（已冻结）

System Drawer 的唯一正确结构如下：

SystemShell（父框，固定，不滚）
├─ Header（固定，不滚）
└─ ContentViewport（✅ 唯一滚动区）
   ├─ Item
   ├─ Item
   ├─ UseCases（展开 / 收起）
   │  ├─ SubItem
   │  ├─ SubItem
   │  └─ SubItem
   └─ Contact

关键原则（必须遵守）

SystemShell（父框）

负责定位（fixed / bottom gap / 居中）

❌ 不滚动

❌ 不随内容变化高度（由设计参数控制）

Header

固定高度

不参与滚动

承载：系统标签 / 标题 / 关闭按钮

ContentViewport

✅ 唯一允许滚动的区域

overflow-y: auto

Use Cases 展开时，只能在这里滚

⚠️ 任何让滚动发生在父框或 body 的做法，都是结构性错误。

三、Use Cases 的正确行为定义
展开 / 收起的唯一规则

展开 Use Cases：

❌ 不允许拉高 SystemShell

❌ 不允许挤压 Header

✅ 只在 ContentViewport 内增加内容高度

✅ 超出可视高度 → 内部滚动

收起 Use Cases：

ContentViewport 高度自然回落

SystemShell 外观高度保持设计约束

结论一句话版

Use Cases 是内容，不是结构。
内容变化，不应影响父结构尺寸。

四、iOS 滚动问题的根因（已定位）
问题现象

iOS Safari / WebView 中：

Drawer 内无法滚动

或滚动抖动、失效

根因（不是 Drawer 本身）

全局 nav { position: fixed } 污染了系统结构

裸 <nav> 被赋予了系统级定位权力

Drawer / Modal 内部的导航语义被误判为“顶栏”

iOS 滚动链被破坏

五、已确立的治理级解决方案（重要）
1️⃣ 顶栏必须显式声明角色
<nav class="sx-navbar" aria-label="Primary Navigation">


只有 .sx-navbar 才允许：

position: fixed

blur / border / shadow

裸 <nav> 不拥有任何布局权力

2️⃣ Drawer 内导航的正确写法
<div class="sx-system-nav" role="navigation">


使用 role="navigation"

不使用 .sx-navbar

不触发系统级 nav 规则

3️⃣ 宪法级结论（冻结）

语义标签 ≠ 结构权力
结构权力只能由显式 class 授予

六、关于高度的最终裁决
System Drawer 的高度策略

❌ 不随内容无限增长

❌ 不写死为半屏 / 全屏

✅ 有“设计上限”

✅ 内容区内部滚动兜底

Drawer 是「系统入口面板」，不是「阅读容器」

七、文件职责声明（防止未来混乱）
文件	职责
sx.drawer.system.css	测试实现文件（可重写 / 可替换）
sx.drawer.css	竖排抽屉设计体系（逻辑层）
sx.menu.css	横排菜单体系（Desktop）
sx.core.css	只允许声明 系统级角色，不得污染语义标签
八、冻结声明（请认真对待）

以下内容 不再讨论、不再回滚：

Drawer 只有一个滚动区（ContentViewport）

Header 永远不滚

Use Cases 不影响父框高度

裸 nav 不拥有 fixed 权力

iOS 滚动问题已被定位并解决

九、设计哲学（给未来的自己）

System UI 不是堆样式，而是治理结构。

不是“怎么能动”，
而是“谁被允许动”。