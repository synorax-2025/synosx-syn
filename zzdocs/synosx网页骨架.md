synosx-site/
├─ assets/
│  ├─ css/
│  │  ├─ sx.core.css
│  │  │  # ✅ 全站制度级样式：变量/按钮/卡片/排版底线/全局组件（所有页面都引用）
│  │  ├─ sx.statusbar.css
│  │  │  # ✅ 底部指纹条样式（可独立拆分，保持 core 干净）
│  │  ├─ sx.drawer.css
│  │  │  # ✅ 顶栏 Menu Drawer 样式（移动端抽屉，制度级）
│  │  ├─ sx.floatlog.css
│  │  │  # ✅ 浮动日志注入逻辑：append / clear / auto-scroll（只管内容进来）
│  │  ├─ sx.dock.css
│  │  │  # ✅ Dock 外壳样式：尺寸 / 吸附 / 折叠 / 门把手 / 移动端适配
│  │  └─ pages/
│  │     ├─ index.page.css
│  │     │  # 页面薄壳：只写 index 私有布局，不改全局 token/按钮制度
│  │     ├─ cases.page.css
│  │     ├─ replay.page.css
│  │     ├─ manifest.page.css
│  │     └─ whitepaper.page.css
│  │        # 同理：每个页面只写“本页差异”，禁止重写 core 组件
│  │
│  └─ js/
│     ├─ sx.core.js
│     │  # ✅ 全站制度级行为：reveal/copy/平滑滚动/通用交互
│     ├─ sx.statusbar.js
│     │  # ✅ 读取 meta 指纹并渲染到底部状态条（可 copy commit 等）
│     ├─ sx.drawer.js
│     │  # ✅ 移动端 drawer 行为：开关/锁滚动/iOS 修复/group toggle
│     ├─ sx.floatlog.js
│     │  # 浮动日志内容控制（日志写入 / 清空 / 滚动）
│     ├─ sx.dock.js
│     │  # Dock 行为控制（拖动 / 吸附 / 展开折叠）
│     └─ runtime/
│        ├─ index.runtime.js
│        │  # 页面运行时：index 专属逻辑（比如跳转/按钮绑定）
│        ├─ cases.runtime.js
│        │  # 页面运行时：cases 页的卡片跳转/筛选等
│        └─ replay.runtime.js
│           # 页面运行时：replay 页 fetch registry + 播放/渲染
│
├─ assets/data/
│  ├─ narratives/
│  │  ├─ chapters.registry.json
│  │  │  # ✅ 章节索引（叙事目录）：case 列表顺序/状态/引用路径
│  │  └─ cases/
│  │     ├─ case-00.json
│  │     ├─ case-01.json
│  │     ├─ case-02.json
│  │     └─ case-03.json
│  │        # ✅ 叙事正文数据（非规范）：页面渲染直接读这里
│  │
│  └─ replay/
│     └─ replay.registry.json
│        # ✅ 回放索引数据（可被 replay.runtime.js 读取）
│        # 你已定：const REGISTRY_URL = "assets/data/replay/replay.registry.json"
│        # 那就坚持只保留这一份（不要 registry/ 再放第二份）
│
├─ schemas/
│  ├─ site.nav.schema.json
│  │  # ✅ site.nav.json 的 schema（导航制度）
│  ├─ replay.registry.schema.json
│  │  # ✅ replay.registry.json 的 schema（回放制度）
│  ├─ chapters.registry.schema.json
│  │  # ✅ chapters.registry.json 的 schema（章节目录制度）
│  └─ narratives.case.schema.json
│     # ✅ case-00/01/02/03 的 schema（叙事正文制度）
│
├─ registry/
│  ├─ site.nav.json
│  │  # ✅ 导航唯一真源：build-includes.mjs 读取它生成 nav.partial
│  └─ schemas.map.json
│     # ✅ schema 校验清单：verify-schemas.mjs 读取它并输出 5 字段报告
│
├─ pages/
│  ├─ case-video.html
│  │  # ✅ 二级页/判例详情页（放 pages/）
│  ├─ case-voicewall.html
│  └─ narrative-case.html
│     # ✅ 单篇叙事详情页（如果你要一个页面渲染某个 case）
│
├─ replay/
│  ├─ rc_brand_15s_v1.mp4
│  ├─ rc_brand_15s_v1.jpg
│  ├─ rc_brand_15s_v2.mp4
│  └─ ...
│     # ✅ 媒体资源（真实文件）：registry/data 只引用，不放媒体本体
│
├─ index.html
│  # ✅ 一级导航页（必须在根目录）
├─ cases.html
│  # ✅ 一级导航页（必须在根目录）
├─ replay.html
│  # ✅ 一级导航页（必须在根目录）
├─ manifest.html
│  # ✅ 一级导航页（必须在根目录）
├─ whitepaper.html
│  # ✅ 一级导航页（必须在根目录）
└─ narratives.html
   # ✅ 一级导航页（必须在根目录）
