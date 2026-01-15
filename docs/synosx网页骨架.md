sx-site/
├─ index.html
├─ manifest.html
├─ whitepaper.html
├─ cases.html
├─ replay.html                 # ✅ 你刚做的：replay.html?trace=xxx
│
├─ pages/                      # 可选：如果你后面页面越来越多
│  ├─ case-video.html
│  ├─ case-voicewall.html
│  └─ data.html
│
├─ assets/
│  ├─ css/                     # 可选：你现在是内联 CSS，以后想抽离再用
│  ├─ js/                      # 可选：同上
│  ├─ img/
│  ├─ icons/
│  └─ fonts/
│
├─ replay/                     # ✅ 证据载体区：视频/海报/截图（只放“回放资产”）
│  ├─ rc_2026-01-12T0730Z_0001.mp4
│  ├─ rc_2026-01-12T0730Z_0001.jpg
│  ├─ rc_2026-01-15T0210Z_0002.mp4
│  └─ rc_2026-01-15T0210Z_0002.jpg
│
└─ registry/                   # ✅ “制度化数据区”：把可变内容从 HTML 里拔出来
   ├─ replay.registry.json      # trace -> 元数据 + media 路径（replay.html 会读取它）
   ├─ cases.registry.json       # cases.html 列表数据来源（可选）
   └─ site.meta.json            # build/version/commit 等（可选）
