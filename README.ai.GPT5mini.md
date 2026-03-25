计划概览

建立可复用的轻量模板并部署第一页；2. 填充有价值的攻略内容与结构化数据；3. 搭建自动化流水线批量生成站点；4. 上线后监测与迭代扩展。

阶段 1 — 技术与模板
目标页: 快速做出一个“游戏嵌入 + SEO 文案”单页作为模板（移动优先，500+ 字正文）。
嵌入方案: 使用 iframe 或自托管 HTML5 包，添加“全屏/静音/重置”按钮并支持 sandbox 属性。
性能: 静态页面（Hugo/Astro 或纯静态 HTML） + CDN 托管游戏资源。
结构化数据: 在页面加入 VideoGame / SoftwareApplication JSON-LD。

阶段 2 — 内容与 SEO
TDK 模板: 标题、描述、meta 按变量模板化（含品牌词与 Unblocked/Online）。
页面正文模块: 简介、玩法说明、Vault Codes、关卡攻略（每关 80–150 字）、FAQ。
关键词策略: 覆盖核心词与长尾（Vault Codes、level passwords、unblocked 等）。
内部链接: 侧栏/底部互推其它二级域名站点，构建权重传递。

阶段 3 — 自动化与流水线
数据驱动: 建立游戏元数据库（关卡名、关键词、Vault Codes、embed URL）。
生成脚本: 脚本化生成 HTML（或静态站点构建任务），批量替换模板字段并输出 sitemap。
AI 文案: 用模板 + AI 批量生成 FAQ/关卡短文，再人工校对以避免重复。
部署脚本: 自动推送到 CDN/对象存储并更新 sitemap.xml。

阶段 4 — 部署 & 验证
DNS/部署: 将二级域名指向托管 IP/静态主机（Cloudflare Pages / Netlify / S3+CloudFront）。
Search Console: 提交站点至 Google Search Console，提交 sitemap。
分析与监测: 集成 Google Analytics / GSC 报表，监测点击、覆盖词、页面停留时间。

阶段 5 — 运营与扩展
内容迭代: 根据 GSC 搜索词拓展长尾页面与 FAQ，逐周更新热门页。
外链策略: 在 Reddit/YouTube/Discord 社区以“攻略分享”形式引流，建立 5–10 个高质量引流点。
站群复制: 将模板与生成脚本用于下一个游戏站点（保持同一托管与资源池）。
交付清单（短期最小可行品 MVP）

单页模板: 嵌入游戏 + 300–500 字唯一正文 + JSON-LD。
数据源: 一个游戏元数据 JSON 文件（Embed URL、关键词、Vault Codes）。
生成脚本: 一键生成并输出 sitemap。
部署与监测: 域名解析、CDN 托管、GSC/GA 配置。
时间线建议

第 1 天: 制作并部署单页模板（MVP）。
第 2–4 天: AI 生成并校对正文与 FAQ，完善 JSON-LD 与 sitemap。
第 5–7 天: 提交 GSC，开始外链与社区投放。
第 2 周起: 批量化复制第二第三个站点并优化。
下一步我可以：1) 为你列出单页模板的字段与示例 HTML 段落，或 2) 直接生成一个可用的静态模板示例。你要我先做哪项？ Also I referenced your README: README.ai.google.md.





### 指定环境变量 ENV_SITE_ROOT, 手动编译
适配
1.https://hhool.github.io/h5games_pok2_geodash/
2.cloudflare pages
https://geometrydash.poki2.online
3.google site
讨论方案

我会先列出可选方案与实作步骤，然后给出在本机手动编译/预览和 CI 中设置 `ENV_SITE_ROOT` 的具体命令与注意点。你选要我帮着改哪个（CI / 本地脚本 / generator 支持 CLI）我就去实施。

概览（要点）
- 目标：让生成的静态页面与 SPA 在三种托管下都使用正确的绝对/相对 URL：
  1. GitHub Pages repo 子路径（例：https://hhool.github.io/h5games_pok2_geodash/）
  2. Cloudflare Pages / 自定义域（例：https://geometrydash.poki2.online）
  3. Google Sites 或 使用 Google 托管的自定义域（最终可访问的完整 URL）
- 原则：在构建时注入最终公开站点根 `ENV_SITE_ROOT`（完整 URL），同时在运行时保留安全回退（你已有的 runtime 验证）。对 GH Pages 额外写入 `dist/CNAME` 以绑定自定义域。

推荐方案（简洁）
- Always-set: 在构建（CI 或 本地）把 `ENV_SITE_ROOT` 设为“最终用户会访问的完整站点 URL”（以 https:// 开头，末尾可带或不带 `/`，构建脚本会 normalize）。
- Generator: 保留当前 runtime 验证（只有当运行时 location 与构建时 siteRoot 匹配时才使用 build-time root），以便同一构建可安全在其它环境回退到 pathname-first-seg。
- Preview 本地：要预览“生产”路径（canonical/OG 指向生产域），可以临时把 `ENV_SITE_ROOT` 设为 `http://localhost:8000/` 或启动本地服务器并使用 hosts 指向生产域（不推荐 DNS hack），或者在 generator 上增加 `--force`/`--site-root` 标志以绕过严格匹配。
- CI per-host workflows: 为每个托管目标维护或参数化 workflow（或使用 workflow 输入），以便在部署到 GH Pages 时写 `CNAME`，在 Cloudflare Pages/Google Host 时不要写 `CNAME`（或写入所需文件/设置）。

本地手动编译示例（macOS zsh / repo 根）
- GitHub Pages repo-subpath:
```bash
export ENV_SITE_ROOT="https://hhool.github.io/h5games_pok2_geodash/"
npm ci
npm run build
node scripts/generate-pages.js
python3 -m http.server 8000 -d dist
# 打开 http://localhost:8000/ 进行检查（注意 runtime 验证可能阻止某些 prod 指向）
```
- Cloudflare Pages / 自定义域:
```bash
export ENV_SITE_ROOT="https://geometrydash.poki2.online/"
npm ci
npm run build
node scripts/generate-pages.js
# 针对 Cloudflare Pages 部署，直接把 dist 上传/推到 Pages，Cloudflare 控制台配置域名
```
- Google Sites / Google 托管（如果是自定义域，使用自定义域 URL）:
```bash
export ENV_SITE_ROOT="https://your-google-custom-domain.example/"
npm ci
npm run build
node scripts/generate-pages.js
# 然后把 dist 内容上传到目标（注意：Google Sites 本身并非静态文件主机，若用 Google Cloud Storage/Cloud Run，请按对应流程部署）
```

CI / Workflow 建议
- `GH Pages (repo subpath)` workflow: 保持你现有的 `ENV_SITE_ROOT`，并在部署步骤之前写入 `dist/CNAME`（内容为自定义域），然后 push 到 `gh-pages`（你已有实现）。
- `Cloudflare Pages`：将 `ENV_SITE_ROOT` 设为公域（例如 `https://geometrydash.poki2.online/`），但不需要写 `CNAME`（Cloudflare Pages 的域名绑定在 Pages 控制面板或通过 DNS 配置完成）。
- `Google`：如果用自定义域，CI 也只需把 `ENV_SITE_ROOT` 设为最终域并生成页面，后续部署方式依托你选的 Google 服务（GCS / Cloud Run / Firebase Hosting 等），每种服务的绑定方式不同。

可选改进（短）
- 让 `scripts/generate-pages.js` 支持 `--site-root` CLI 参数（更直观，且 CI 可把参数传给 node 而非依赖 ENV）。
- 在 `package.json` 加几个便捷脚本：
  - `"build:gh": "ENV_SITE_ROOT='https://hhool.github.io/…' npm run build && node scripts/generate-pages.js"`
  - `"build:cloudflare": "ENV_SITE_ROOT='https://geometrydash.poki2.online/' npm run build && node scripts/generate-pages.js"`
- 在 generator 中对 `ENV_SITE_ROOT` 做严格 normalize（确保以 `/` 结尾或去掉重复斜杠），并在生成的页面注入 `window._globalSiteRoot`（你已有）。

注意事项 / 陷阱
- 运行时验证：你当前实现会在 runtime 检查 location 与构建时 root 是否匹配，若不匹配会回退到 pathname heuristic——这对本地预览可能造成“看起来未使用 build-time root”的情况。为测试生产 canonical/OG，最好在临时环境把 host 指向目标域或在构建前临时把 `ENV_SITE_ROOT` 设为 `http://localhost:8000/`。
- GH Pages repo-subpath 与 repo root 混淆：确保 `window._globalRepoBase`（路径段）与 `window._globalSiteRoot`（完整 URL）区别清晰：前者用于拼相对内部资源路径，后者用于构造 OG/canonical 绝对 URL。
- Cloudflare Pages 绑定域时要在 Pages 控制台/域名 DNS 做配置；写 `CNAME` 到 `dist` 并不会自动在 Cloudflare Pages 生效（不同平台有不同要求）。

下一步建议（请选择）
- 我可以：A) 在 `scripts/generate-pages.js` 增加 `--site-root` 支持并加 demo `package.json` 脚本；或 B) 只在 `.github/workflows/ci-deploy.yml`/`.github/workflows/static.yml` 中为三种托管分别添加或参数化 `ENV_SITE_ROOT` 与写 CNAME 的步骤；或 C) 跑一次本地构建并帮你验证（需要你允许我运行构建命令）。
请选择你要我执行的下一步（A / B / C 或 指定其它），我就开始。
```

