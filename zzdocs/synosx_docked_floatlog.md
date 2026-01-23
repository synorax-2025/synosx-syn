# SynOSX Docked FloatLog 设计意图（冻结版 · v2）

> 本文用于**冻结并统一** SynOSX 网站中  
>「运行时日志窗（FloatLog）+ Dock 载体协议（Dock Protocol）」的制度设计。
>
> 本文不是 UI 说明书，而是 **S0 级运行时观察组件的宪法定义**。

---

## 一、组件定位（What it is）

### 1️⃣ Dock（S0 Window Carrier）

**Dock 是一个“窗口载体协议”，不是某个具体业务组件。**

它负责：

- 位置（fixed / floating）
- 拖动（pointer events，PC + Mobile）
- 边缘吸附（dock-left / dock-right）
- 门把手（edge handle）
- 展开 / 折叠 / 隐藏

Dock **不关心内容是什么**。

---

### 2️⃣ FloatLog（Audit Engine Skin）

**FloatLog 是运行时治理内容的一种“皮肤实现”。**

它负责：

- Audit / Replay 文本的视觉样式
- 行结构、滚动条
- 内容 append / clear

FloatLog **不负责位置、吸附或门把手**。

---

## 二、核心理念（Why this exists）

> **治理不是事后查看，而是运行时可观察。**

FloatLog 的存在意味着：

- 系统正在运行
- 治理正在发生
- 行为正在被记录

它不是 toast、不是 drawer、不是调试工具。

---

## 三、状态模型（State Model）

### Dock 载体状态（Carrier State）

| 状态 | 含义 |
|----|----|
| `floating` | 自由悬浮，可拖动 |
| `docked-left` | 吸附在左边缘 |
| `docked-right` | 吸附在右边缘 |

---

### 内容可见性状态（Panel State）

| 状态 | 含义 |
|----|----|
| `expanded` | 内容展开可见 |
| `collapsed` | 内容收起，仅剩门把手 |
| `hidden` | 整个面板隐藏（X 关闭） |

> **Dock 状态 ≠ 内容状态，两者解耦。**

---

## 四、默认行为（Default Policy）

- Dock 协议 **必须支持 OPEN（expanded）作为一等能力**
- 是否在页面加载时显示，由页面 runtime 决定

禁止 Dock 自行决定业务展示逻辑。

---

## 五、Handle（门把手）制度定义

### 核心原则

> **Handle 不是入口，而是 Docked + Collapsed 状态的“残影”**

### 合法出现条件

- Dock 状态 = docked-left / docked-right
- Panel 状态 = collapsed

### 明确禁止

- 页面加载即显示 handle
- 内容存在但只显示 handle

---

## 六、交互原则（Interaction Rules）

### 拖动

- 在 expanded 状态下可自由拖动
- 拖到屏幕边缘 → 自动进入 docked

### 吸附（Dock）

- 吸附阈值按设备区分（Desktop / Mobile）
- 移动端吸附更“克制”，避免误触

### 折叠 / 展开

- Collapse：内容隐藏，保留门把手
- 点击门把手 → 恢复 expanded

### 关闭

- X 按钮 = 强语义关闭
- 含义：**本次会话不再观察运行时**

---

## 七、职责边界（Separation of Concerns）

### `sx.dock.css / sx.dock.js`

- 位置 / 拖动 / 吸附
- 门把手方向与形态
- 移动端适配

### `sx.floatlog.css`

- 终端视觉样式
- 行布局、滚动条

### `sx.floatlog.js`

- 内容 API：
  - `append()`
  - `clear()`
  - `setTitle()`

### 页面 runtime

```js
SXFloatLog.append(...)

```
## 八、冻结声明（Freeze Statement）

### `自本文起：`
Dock 作为 S0 Window Carrier 存在
FloatLog 仅为内容皮肤
状态模型解耦
Handle 只属于 Docked + Collapsed
任何混合职责的实现，视为制度违宪。