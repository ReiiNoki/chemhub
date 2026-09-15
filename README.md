# ChemHub

紧凑深色的化学资源导航站，使用原生 HTML、CSS 和 JavaScript，无后台或数据库。支持顶部个人置顶工具、搜索、分类筛选、网格／列表和记忆分类折叠状态；没有已保存设置时分类默认全部折叠。

直接打开 `index.html` 即可本地使用。资源数据在 `tools.js`，图标在 `assets/icons/`；新增资源只追加到数组末尾，不插入或重排旧条目。通常添加对应数字索引的 PNG；图标尚未取得时可显式设置 `icon:false`，仅显示 `i` 字段的文字缩写，不请求不存在的图片。分类内置顶由 `toolCategoryPriority` 配置，只调整显示顺序，不改变数据索引。

## 置顶常用工具

正式首页的「置顶工具」区位于分类列表上方。点击「选择工具」搜索，或展开分类后点击卡片右上角的图钉；再次点击图钉或顶部快捷入口的 × 可取消置顶。快捷入口按置顶先后排列，原分类位置、资源总数和图标索引不变。

置顶以 URL 保存到 `chemhub.pinned-tools.v1`，刷新后恢复，同源标签页会同步；不依赖账户或后台。搜索／分类筛选期间暂时隐藏置顶区，返回「浏览」或清除筛选后恢复。浏览器存储受限时仍可临时使用，但会提示更改仅对当前页面有效。换浏览器、设备或站点域名（包括本地文件与线上入口切换）不会自动迁移这些设置。

## Git 追踪范围

- 保留正式源码、测试源码、`docs/` 中的候选网站清单、维护说明，以及图标和资源来源记录。
- `.gitignore` 排除依赖、`dist/`、测试产物、编辑器配置、密钥、日志和第三方参考抓取资料。
- Git 仓库内容不等于网站发布内容：维护文档和测试源码可保存在仓库中，但不部署到公开站点。

## 构建发布目录

需要 Node.js，无需安装构建依赖：

```sh
node scripts/build.cjs
```

脚本会重建 `dist/`，只复制四个正式文件和资源实际使用的 PNG；仅 `icon:false` 的文字标识条目跳过图片，其余条目缺图或图片格式错误仍会阻止构建：

```text
dist/
├── index.html
├── design.css
├── app.js
├── tools.js
└── assets/icons/*.png
```

当前为 76 个资源、73 个本地图标，共输出 77 个文件。MDPI、Thieme Connect、Taylor & Francis Online 暂用文字标识；补齐真实图标后，保持索引 73～75，更新来源记录并移除各条目的 `icon:false`。未指定 `icon` 或设为 `true` 均要求对应 PNG，其他类型的值会阻止构建；显式文字模式下，即使有遗留 PNG 也不会发布。

请修改根目录源码，而不是 `dist/` 中的副本。脚本不会发布 `docs/`、测试或来源记录；生成目录不纳入 Git。以后新增隐私政策、`ads.txt` 或其他正式文件时，需要同步更新脚本中的发布白名单。

## Cloudflare Pages：连接 GitHub

创建 Pages 项目时选择连接 Git 仓库，关联 GitHub 仓库，设置：

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | `None` |
| 构建命令 | `node scripts/build.cjs` |
| 构建输出目录 | `dist` |
| 根目录 | 留空，使用仓库根目录 |
| 环境变量 | 当前无需配置 |

以后推送到 `main`，Pages 会重新构建并部署。不需要 GitHub Pages，也不要把整个仓库根目录作为网站发布目录。平台配置仍需在 Cloudflare 后台完成；这些文件不会自动创建 GitHub 仓库或部署网站。

参考：[Pages Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)。

## 验证

```sh
# 无第三方依赖：验证发布白名单、文件完整性、重复构建与错误输入保护。
node tests/build.cjs

# 使用已安装的 Playwright 和 Chrome；也可通过 PLAYWRIGHT_MODULE 指定模块目录。
node tests/designs.cjs
```

构建测试使用临时目录，不改动网站源码或本地 `dist/`。浏览器测试只覆盖正式首页，不生成截图。详细交互、宽屏留白和测试说明见 [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md)。
