synosx-site/
├─ assets/
│  ├─ css/
│  │  ├─ sx.core.css              # ✅ 全站制度级样式（变量/组件/状态条/可读性底线）
│  │  ├─ sx.statusbar.css         # ✅ 底部指纹条（可选：拆分更清晰）
│  │  └─ pages/
│  │     ├─ index.page.css
│  │     ├─ cases.page.css
│  │     ├─ replay.page.css
│  │     ├─ manifest.page.css
│  │     └─ whitepaper.page.css
│  └─ js/
│     ├─ sx.core.js               # ✅ 全站制度行为（reveal/copy/scroll）
│     ├─ sx.statusbar.js          # ✅ 指纹条读取 meta + copy commit（可选拆分）
│     └─ runtime/
│        ├─ index.runtime.js       # index 专属交互（跳 replay）
│        ├─ cases.runtime.js       # cases 专属交互（跳 case 页）
│        └─ replay.runtime.js      # replay 专属运行时（fetch registry + 播放）
│
├─ pages/
│  ├─ case-video.html
│  ├─ case-voicewall.html
│  └─ ... (更多判例页)
│
├─ registry/
│  ├─ replay.registry.schema.json
│  └─ replay.registry.json
│
├─ replay/
│  ├─ rc_brand_15s_v1.mp4
│  ├─ rc_brand_15s_v1.jpg
│  ├─ rc_brand_15s_v2.mp4
│  └─ ...
│
├─ index.html
├─ cases.html
├─ replay.html
├─ manifest.html
├─ whitepaper.html
└─ docs/
   └─ ... (可选：写你的网站制度说明)
