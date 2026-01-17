# Case 分类说明（SynOSX Governance Narratives）

> 本文档用于**制度性说明 SynOSX Narratives 中 Case 的分类方式与法律地位**。  
> 所有 Case 均为 **非规范性（Non-normative）治理例证**，用于解释制度如何在现实复杂度中被理解、引用与验证。

---

## 一、核心结论（必须先读）

- **所有 `case-xx.json` 在制度层面全部都是 Case**
- **不存在“小说 Case”和“判例 Case”的制度分裂**
- 区别只存在于：**来源类型（Source Type）**

> 表达方式可以是叙事性的  
> 制度身份必须是治理 Case

---

## 二、为什么必须统一称为 Case？

在 SynOSX 体系中：

- 治理系统 **不接受“作者视角”**
- 也不接受“自由叙事层”凌驾于制度之上

因此：

> 任何被系统引用、解释、展示的叙述  
> 都必须被治理为 Case

这保证了：
- 世界观不逃逸制度
- 价值观不成为隐性规范
- Narratives 不侵入宪法与执行层

---

## 三、Case 的两种来源类型（唯一允许的区分）

### 1️⃣ 原型叙事型 Case（Proto / Foundational Case）

**代表文件：**
- `case-00.json`

**来源：**
- 架构哲学
- 权力 / 能力分离的原始投影
- SynOSX 世界观与制度动机

**回答的问题是：**
> 为什么这个治理体系必须这样设计？

**制度地位说明：**
- 不来源于具体事故
- 但被制度采纳为长期解释样本
- 等价于现实法律中的：
  - 制宪会议记录
  - 宪法解释文献
  - 制度起源案例

⚠️ **重要约束**
- 仍然是 Case
- 仍然是 Non-normative
- 不可被当作执行规则或推理依据

---

### 2️⃣ 派生判例型 Case（Derived / Incident Case）

**代表文件：**
- `case-01.json`
- `case-02.json`
- `case-03.json`

**来源：**
- 实际系统事故
- 权限绕过
- Intent 缺失
- 审计失效
- Voice / Identity 断裂

**回答的问题是：**
> 在既定制度下，某种风险是如何被识别、阻断与记录的？

**制度地位说明：**
- 来源于真实或等价真实的系统事件
- 用于说明治理机制如何生效
- 但仍然 **不构成规则本身**

---

## 四、Case ≠ 小说（这是关键边界）

| 对比项 | 小说 | SynOSX Case |
|------|------|-------------|
| 是否可引用 | ❌ | ✅ |
| 是否受 Schema 约束 | ❌ | ✅ |
| 是否进入 Registry | ❌ | ✅ |
| 是否可被治理系统索引 | ❌ | ✅ |
| 是否影响制度理解 | 非正式 | 正式但非规范 |

> 即使表达风格接近小说  
> 只要进入 Registry  
> 就必须遵守 Case 的制度身份

---

## 五、Registry 与 Case 的关系

### `chapters.registry.json` 的职责

- 定义 Case 的：
  - 顺序（order）
  - 状态（draft / published）
  - 分类（foundational / incident）
- 决定哪些 Case 可被前端展示
- **不解释 Case 内容**
- **不生成规范含义**

它是：
> Case 的“目录与名册”  
> 不是章节控制器  
> 也不是叙事逻辑层

---

## 六、与 Replay 的制度分离（补充）

- Case = 解释性治理例证
- Replay = 执行事实回放（Evidence / Artifact）

因此：
- `replay.registry.json` 必须位于 `registry/` 根目录
- Replay 可被 Case 引用
- 但 Case 不拥有 Replay

---

## 七、最终原则（可作为对外声明）

> These narratives are **illustrative governance cases only**.  
> They are non-normative, non-executable,  
> and must not be treated as system rules, policies, or logic.

---

**SynOSX Governance Narratives**  
*Structure governs even its own stories.*
