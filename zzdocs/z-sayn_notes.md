git remote -v
你要看到的是：
synorax-2025/synosx-site.git

你的网站地址是：

https://synorax-2025.github.io/synosx-site/

推送后刷新即可。
git status

git add .
git commit -m "save"
git push

git tag -a v2 -m "SynOSX Site v2: Nav + Drawer + Manifest/Whitepaper menus finalized"
git push --tags

python -m http.server 8080
http://localhost:8080/registry/narratives/chapters.registry.json
http://localhost:3000/replay.html?trace=rc_brand_15s_v1
npx --yes serve . 手机连接网页设计界面
pnpm dlx serve dist -l 3000  手机界面dist

pnpm install
pnpm build
node tools/verify-schemas.mjs

allow pasting  F12手输入这个后才能复制

