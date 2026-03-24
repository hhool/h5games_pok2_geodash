可行性结论
总体可行。把首页与首页展示内容在构建时注入（静态渲染）、把次级/列表页面用客户端动态读取是兼顾 SEO 与迭代速度的实用折衷；核心要点是：重要文本和 JSON‑LD 必须在构建产物中可见给爬虫（构建时注入），频繁变更的非核心列表可客户端加载以降低重建频率。

分阶段执行建议（优先级由高到低）

阶段 1 — 必做（SEO 基础，立即执行）

构建时注入首页正文与 JSON‑LD：把 data/site.json 和 data/games.json 在 scripts/generate-pages.js 中渲染到 dist/index.html，确保首页包含 300–500+ 字、清晰的 TDK 与 JSON‑LD。参考文件：data/seo.json、data/site.json、game-template.html、scripts/generate-pages.js、dist/。
每个游戏页生成静态 HTML（首屏文本 + JSON‑LD）：生成 dist/gX/index.html，包含 title、meta description、canonical、JSON‑LD（VideoGame）。
生成并部署 sitemap.xml 与 robots.txt：保证 sitemap 列出 / 与 /gX/，robots 允许抓取。
阶段 2 — 增强（可在部署前完成）

质量化正文：避免模板化重复内容。用数据驱动写作后进行人工校对（防止重复/拼凑导致降权）。
OpenGraph/Twitter 卡片：在 data/seo.json 中配置 og:image、og:title 等，注入到 dist。
Canonical 与 hreflang（如需要）：确保每页 link rel=canonical 指向站点 URL（用 siteUrl + id 生成）。
阶段 3 — 自动化与发布流程

CI 构建 + 自动部署：在 push 到 main 时运行 npm run build 并发布 dist/（Cloudflare Pages/GitHub Actions）。
增量/触发重建：当 data/*.json 变更时通过 webhook 或 GitHub Action 触发重建并清 CDN 缓存。
监测与告警：将 Google Search Console、GA、Error logging（Sentry）接入，发生爬取错误或 500 时报警。
技术细节 & 检查清单（发布前必验）

页面必须包含静态文本（爬虫能读到 300–500 字）。
JSON‑LD 可见：检查 dist/index.html 与 dist/gX/index.html 中的 <script type="application/ld+json">。
绝对路径资源：在模板中使用绝对路径（如 /data/games.json、/assets/...），避免子路径请求错误。
HTTP 状态码：所有生成的页面返回 200（不是 200 带 HTML 错误页）。
可抓取性测试：用 Google Search Console 的 URL Inspection、Rich Results Test、Lighthouse 确认。
重复内容检测：使用小批量对比工具（文本相似度）避免多个页面高度重复。


## FAQ
### site的seo，关键词有哪些
Primary: Geometry Dash, play Geometry Dash online, Geometry Dash online, Geometry Dash unblocked, Geometry Dash Lite, Geometry Dash web, Geometry Dash browser
Site / Format: HTML5 games, play HTML5 games, mobile HTML5 games, online games no download, free online games, embed HTML5 game
Gameplay / Intent: Geometry Dash tips, Geometry Dash walkthrough, Geometry Dash levels, Geometry Dash practice mode, Vault codes, Geometry Dash cheats (use谨慎)
User intent / Long‑tail: play Geometry Dash online no download mobile, Geometry Dash unblocked for school, Geometry Dash Vault Codes 2026, Geometry Dash level guide browser, Geometry Dash lite play online
Chinese / 本地化: 几何冲刺 在线 玩, 几何冲刺 无需 下载, 几何冲刺 攻略, 几何冲刺 关卡 要点