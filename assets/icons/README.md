# ChemHub 本地图标

`0.png`～`72.png` 与 `tools.js` 的工具顺序对应，主站和设计预览共用。全部文件均为真实 PNG；请不要把 SVG、ICO、HTML 错误页面直接改名为 `.png`。

新增工具请追加到 `tools` 数组末尾，不要插入中间或重排已有工具，以免数字图标错配。分类展示顺序由 `tools.js` 的 `toolCategoryOrder` 独立管理，未列出的新分类会自动追加到末尾。

## 新增出版社：暂用文字标识

资源索引 `73`～`75` 已收录，但尚未取得可核验的图标：

| 索引 | 网站 | 文字缩写 |
| --- | --- | --- |
| 73 | MDPI | MD |
| 74 | Thieme Connect | Th |
| 75 | Taylor & Francis Online | TF |

本轮重试官网与 Google 图标缓存仍被抓取工具的 `Blocked internal address` 安全检查拒绝（代理 fake-IP 解析），没有绕过。条目显式设置 `icon:false`，直接显示已有文字缩写，不发出不存在的 PNG 请求，不生成自制占位图片，也不借用其他品牌图标。`0.png`～`72.png` 全部保持不变。

待补状态和尝试时间记在 `sources.json` 的 `pendingIcons`，没有伪造下载地址、文件或 SHA-256；原 `checkedAt` 及已下载图标记录不改写。以后取得真实图标后，按原索引添加 PNG、填写来源与校验值、清除对应待补记录，再移除 `icon:false`；未明确设置为 `false` 的条目仍必须提供有效 PNG，否则构建失败。不要为补图重排 `tools` 或重编号。

## 新增 Chemistry Reference Resolver

`72.png` 对应 Chemistry Reference Resolver，归入「文献专利搜索」，入口为 `https://chemsearch.kovsky.net/`。采用首页声明的 `https://chemsearch.kovsky.net/favicon.ico`，原图为 16×16 ICO，经真实解码与 Lanczos 重采样输出为 32×32 PNG，页面仍显示 16px。

首次 Python 请求发生 TLS 握手超时，随后 Chrome 默认 TLS 验证下取得 200；没有绕过证书警告。旧 `0.png`～`71.png` 不变，来源和 SHA-256 见 `sources.json`；本次不表示旧来源重新核验。

## 新增摩熵化学 MolAid

`71.png` 对应「摩熵化学 MolAid」，归入「化合物数据库」，使用用户指定的 `https://chem.molaid.com/home`。图标来自首页声明的 `https://chem.molaid.com/imgs/favicon.ico`；虽然地址和响应类型标作 ICO，实际内容是 16×16 PNG，已真实解码并以 Lanczos 重采样为 32×32 PNG，保留原有品牌图形，页面仍显示 16px。

旧 `0.png`～`70.png` 不变；来源和 SHA-256 见 `sources.json`。本次只核对新增入口和图标，不表示所有旧来源重新核验。

## 新增社区与资讯

`66.png`～`70.png` 对应 5 个社区／资讯入口，均为 32×32 真 PNG，页面仍显示 16px。旧 `0.png`～`65.png` 未改动。

| 文件 | 网站 | 来源类型 |
| --- | --- | --- |
| `66.png` | 小木虫 | 论坛页面声明的 ICO，真实解码转换 |
| `67.png` | 化学空间 Chem-Station | 中文首页 Logo 左侧的红色图形标识，裁取后等比缩小；不使用 WordPress 默认图标 |
| `68.png` | Chemistry Stack Exchange | 首页声明的 32px ICO，真实转换 |
| `69.png` | ChemistryViews | 站点缓存图标；官网本轮遇 403／人机验证，未绕过，也未宣称直接取得原生图标 |
| `70.png` | Chemistry World | 首页声明的 32px PNG favicon |

来源和 SHA-256 见 `sources.json`，访问核对见 `../../docs/references/community-resources.json`。缓存仅在整理时下载，运行时不请求外部服务。此次更新的 `checkedAt` 不表示全部旧图标上游重新核验。

## 新增 Sci-Hub

`65.png` 已替换为当前目标页 `https://sci-hub.shop/` 声明的乌鸦图标，来源为 `https://sci-hub.shop/icon.png`，不再使用此前 .ru 的红星。原图为 151×294 PNG，等比例缩小并补为 32×32 透明画布；页面仍以 16px 显示。来源和 SHA-256 见 `sources.json`；这里只记录目标页图标，不认定该域名的官方归属。原有 `0.png`～`64.png` 未改动。

## 新增课题组与机理资料

`45.png`～`63.png` 对应 19 个课题组主页，`64.png` 对应「福山–横岛机理习题」。20 个新图标均为 32×32 真 PNG，页面仍以 16px 显示；旧 `0.png`～`44.png` 未改动。

| 文件 | 来源类型 |
| --- | --- |
| `45、46、47、50、59、60、61、62.png` | 课题组页面明确声明的 PNG、ICO 或 GIF favicon，真实解码转换 |
| `48.png` | UCLA 化学系主机根 favicon，不标作 Houk 独立课题组设计 |
| `49.png` | Yaghi 主页展示的 Berkeley 标识，等比例缩小并补透明画布 |
| `51、55.png` | Google 缓存的所属院所品牌图标，分别用于游书力和唐勇组 |
| `52.png` | Google 缓存的四川大学校徽，用于冯小明／ASL |
| `53、54、57.png` | 北京大学官网校徽，用于杨震、雷晓光、裴坚–王婕妤组 |
| `56.png` | Google 缓存的 USTC 字标，用于龚流柱组 |
| `58.png` | Google 缓存的东京大学蓝黄银杏叶图标，用于井上组 |
| `63、64.png` | 名古屋大学官网 favicon，分别用于横岛组和题库 |

已目视核对缓存图标，未采用通用占位图；缓存仅在整理时下载，运行时不请求 Google。课题组没有有效 favicon 时使用所属机构标识，明确区分 `favicon`、`provider-favicon`、`provider-logo` 和 `provider-cached-favicon`，不声称全部是独立课题组 Logo。所有来源和校验值见 `sources.json`。

## 新增国外试剂采购

| 文件 | 工具 | 来源类型 |
| --- | --- | --- |
| `40.png` | 富士和光 Wako | 试剂官网声明的 FUJIFILM ICO favicon，真实转换为 PNG |
| `41.png` | 关东化学 Kanto | 官网声明的 ICO favicon，提取 32px 帧并转换为 PNG |
| `42.png` | Strem | 官网声明的 favicon，实际为 JPEG，真实转换为 PNG |
| `43.png` | Fluorochem | 官网根路径提供的 ICO favicon，提取 32px 帧并转换为 PNG |
| `44.png` | Cambridge Isotope Laboratories | Google 缓存的 CIL 品牌图标，等比例缩小后补为方形 PNG |

新增五个图标均为 32×32 PNG，页面仍以 16px 显示。CIL 的静态页面未声明品牌 favicon，浏览器访问又返回 403，因此使用已目视核对的缓存图标，并非直接从官网取得。原有 `0.png`～`39.png` 未改动；来源和 SHA-256 见 `sources.json` 的 `addedIcons`，运行时不请求外部图标服务。

## 此前新增试剂采购

| 文件 | 工具 | 来源类型 |
| --- | --- | --- |
| `38.png` | TCI Chemicals | Google 缓存的 TCI 三六边形字标，JPEG 真实转换为 PNG |
| `39.png` | Thermo Fisher Scientific | Google 缓存的红色 T 字标，下载后本地加载 |

两站官网及 favicon 对自动请求返回 403，因此采用已目视核对的缓存图标，不将其误记为直接抓取的官网图标。新增文件均为 32×32 PNG，页面仍以 16px 显示，不影响原有 `0.png`～`37.png`。来源和 SHA-256 记录在 `sources.json` 的 `addedIcons`；页面运行时不依赖图标服务。

## 新增学术期刊

| 文件 | 工具 | 来源类型 |
| --- | --- | --- |
| `31.png` | ACS Publications | 官方博客 Axial 声明的新版 ACS 品牌 favicon |
| `32.png` | RSC Publishing | 英国皇家化学会官网图标 |
| `33.png` | ScienceDirect · Elsevier | 出版商 Elsevier 官网 favicon |
| `34.png` | Wiley Online Library | 出版商 Wiley 官网 SVG favicon，真实渲染为 PNG |
| `35.png` | Springer Nature Link | 期刊平台官网 ICO favicon，提取 32px 帧转为 PNG |
| `36.png` | Nature | 期刊官网 PNG favicon |
| `37.png` | Science | Google 缓存的 Science 红底白色 S 图标，下载后本地加载 |

新增七个图标均为 32×32 PNG，页面仍以 16px 显示；原有 `0.png`～`30.png` 未改动。部分期刊主站拒绝自动请求，因此明确区分官网原生图标、出版商／关联官网图标和缓存来源；不以 403 响应判断网站下线。详细来源和 SHA-256 见 `sources.json` 的 `addedIcons`。

## 此前图标修复

| 文件 | 工具 | 来源类型 |
| --- | --- | --- |
| `6.png` | ChEBI | 官网 ChEBI favicon |
| `7.png` | ZINC | docking-org 维护的 ZINC-22 项目官方仓库 favicon；原站当前返回人机验证页 |
| `9.png` | SciFinder | 官方登录页面声明的 CAS favicon |
| `10.png` | Organic Syntheses | 官网 logo，等比例缩小并补齐为方形，不是官网原生 favicon |
| `12.png` | Common Organic Chemistry | 官网 logo，等比例缩小并补齐为方形，不是官网原生 favicon |
| `16.png` | SDBS | SDBS 设置了空 favicon，使用其提供机构 AIST 的官网图标 |

以上六个文件统一输出为 32×32 PNG，不改变页面中 16px favicon 的显示尺寸。来源 URL、类型说明和输出文件校验值见 `sources.json`。

另外将 `8、11、15、17、18、20、21、25.png` 原本的 ICO 内容转换为真正的 PNG，保留原图形及解码尺寸。

- 图标随项目本地加载，不依赖图标聚合服务或访问外部 CDN。
- 页面仍保留加载失败时的文字缩写，避免新增工具或误删文件导致破图。
- 未改变其他已有 PNG 图形，也未重新验证它们的上游品牌来源。
- 官网 logo、图标的权利属于相应网站或机构；这里只用于导航识别。
- `tests/designs.cjs` 根据工具数据检查全部应有 PNG 的文件头、来源记录的索引与 SHA-256，以及 HTTP / 本地文件模式下的浏览器解码；显式文字模式则检查待补记录、缩写与不存在的图片不被请求。
