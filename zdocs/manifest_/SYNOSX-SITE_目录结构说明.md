# SYNOSX-SITE 目录结构说明（带中文注释）

> 本文档用于解释 **SYNOSX-SITE**（官网 / 判例 / 叙事展示系统）的目录骨架设计原则，
> 说明每一层的职责、边界，以及它与 **SynOSX 核心治理系统** 的关系。

---

## 一、整体定位（一句话）

**SYNOSX-SITE 是一个「制度叙事展示系统」**

- ❌ 不生成治理规则  
- ❌ 不参与运行时裁决  
- ✅ 只展示已存在的制度、判例与叙事投影  

它的职责是：  
> **让治理体系“可被理解”，而不是“被执行”。**

---

## 二、顶层目录结构（角色划分）

```text
SYNOSX-SITE
├─ assets/        # 表现层（CSS / JS / UI 行为）
├─ pages/         # 页面壳（HTML 结构）
├─ registry/      # 内容制度层（Narratives / Replay 的数据真源）
├─ schemas/       # 内容制度的 Schema（合法性裁判）
└─ zdocs/         # 说明文档（非执行）
```

这是一个 **内容系统**，而不是治理系统本体。

---

## 三、assets/ —— 表现层（如何被看到）

```text
assets/
├─ css/
│  ├─ sx.core.css              # 全站制度级视觉（不可随意改）
│  ├─ sx.statusbar.css         # 系统状态条样式
│  └─ pages/
│     ├─ index.page.css
│     ├─ cases.page.css
│     ├─ narratives.page.css
│     └─ narrative-case.page.css
│
├─ js/
│  ├─ sx.core.js               # 全站核心交互
│  ├─ sx.statusbar.js          # 状态条逻辑
│  └─ runtime/
│     ├─ index.runtime.js
│     ├─ cases.runtime.js
│     ├─ narratives.runtime.js
│     └─ narrative-case.runtime.js
```

**设计原则：**

- `sx.*` = 制度级样式 / 行为（全站一致）
- `*.page.css` = 页面私有表达
- `*.runtime.js` = 把 registry 数据 → DOM

---

## 四、pages/ —— 页面壳（结构，不含内容）

```text
pages/
├─ index.html
├─ cases.html
├─ narratives.html
├─ narrative-case.html
├─ replay.html
└─ whitepaper.html
```

**原则：**

- HTML 只负责结构
- 不写业务数据
- 不写叙事正文
- 所有内容来自 registry

---

## 五、registry/ —— 内容制度层（事实真源）

```text
registry/
└─ narratives/
   ├─ case-00.json              # 原型叙事（世界观 / 宪法投影）
   ├─ case-01.json              # 判例 01
   ├─ case-02.json              # 判例 02
   ├─ case-03.json              # 判例 03
   ├─ chapters.registry.json    # 章节索引（顺序 / 状态 / 分类）
   └─ replay.registry.json      # 回放资源索引（视频 / trace）
```

**重要认知：**

- narrative ≠ 小说  
- narrative = **Case 的一种表达形式**
- JSON 是因为：可校验、可索引、可程序化使用

---

## 六、schemas/ —— 内容合法性裁判

```text
schemas/
├─ chapters.registry.schema.json
├─ narratives.chapter.schema.json
└─ replay.registry.schema.json
```

**职责说明：**

| Schema | 约束对象 |
|------|---------|
| chapters.registry.schema.json | chapters.registry.json |
| narratives.chapter.schema.json | 单个 case-XX.json |
| replay.registry.schema.json | replay.registry.json |

Schema 的消费者是：

- CI
- 构建脚本
- 校验工具

**页面 runtime 不直接使用 schema。**

---

## 七、与 SynOSX 核心系统的关系

| 维度 | SynOSX Core | SYNOSX-SITE |
|----|-----------|------------|
| 目标 | 治理执行 | 治理理解 |
| JSON | 契约 / 制度 | 内容 / 判例 |
| Schema | 宪法级 | 校验级 |
| Runtime | 强制执行 | 渲染展示 |

**两者是同构思想，不是同一系统。**

---

## 八、一句话宪法级总结

> 核心系统用制度约束机器，  
> 展示系统用叙事约束理解。

---

（完）
