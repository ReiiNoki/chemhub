// Dependency-free static export. Only this allowlist and generated SEO pages are published.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const siteUrl = 'https://chemhub.dpdns.org';
const catalogSource = fs.readFileSync(path.join(root, 'tools.js'), 'utf8');
const catalogJson = vm.runInNewContext(
  `${catalogSource}\nJSON.stringify({tools, toolCategories, toolCategoryOrder, toolCategoryPriority, toolCategorySlugs});`,
  Object.create(null),
  { timeout: 1000 }
);
const { tools, toolCategories, toolCategoryOrder, toolCategoryPriority, toolCategorySlugs } = JSON.parse(catalogJson);

if (!Array.isArray(tools) || !tools.length) throw new Error('tools.js must contain a non-empty tools array');
if (!Array.isArray(toolCategories) || !Array.isArray(toolCategoryOrder)) throw new Error('tools.js category data is invalid');
if (!toolCategoryPriority || typeof toolCategoryPriority !== 'object') throw new Error('tools.js category priorities are invalid');
if (!toolCategorySlugs || typeof toolCategorySlugs !== 'object') throw new Error('tools.js category slugs are invalid');

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const toolSlugs = new Set();
for (const [index, tool] of tools.entries()) {
  for (const key of ['slug', 'n', 'd', 'c', 'i', 'u']) {
    if (typeof tool[key] !== 'string' || !tool[key]) throw new Error(`tool ${index}.${key} must be a non-empty string`);
  }
  if (!slugPattern.test(tool.slug)) throw new Error(`Invalid tool slug: ${tool.slug}`);
  if (toolSlugs.has(tool.slug)) throw new Error(`Duplicate tool slug: ${tool.slug}`);
  toolSlugs.add(tool.slug);
  if (tool.icon !== undefined && typeof tool.icon !== 'boolean') throw new Error('tool.icon must be a boolean when specified');
  try {
    const url = new URL(tool.u);
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch { throw new Error(`Invalid tool URL: ${tool.u}`); }
}
const categorySlugList = toolCategories.map(category => toolCategorySlugs[category]);
if (categorySlugList.some(slug => !slugPattern.test(slug || ''))) throw new Error('Every category must have a valid explicit slug');
if (new Set(categorySlugList).size !== categorySlugList.length) throw new Error('Category slugs must be unique');
if (tools.some(tool => !toolCategories.includes(tool.c))) throw new Error('Every tool category must be listed in toolCategories');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function escapeXml(value) { return escapeHtml(value); }
function safeJson(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
function hostname(url) { return new URL(url).hostname.replace(/^www\./, ''); }
function orderCategoryTools(items, category) {
  const priority = toolCategoryPriority[category] || [];
  const rank = tool => { const index = priority.indexOf(tool.u); return index < 0 ? priority.length : index; };
  return [...items].sort((a, b) => rank(a) - rank(b));
}
function icon(tool, index, prefix = '') {
  const image = tool.icon === false ? '' : `<img src="${prefix}assets/icons/${index}.png" alt="" loading="lazy" onerror="this.remove()">`;
  return `<span class="tool-logo"><span class="monogram">${escapeHtml(tool.i)}</span>${image}</span>`;
}
function staticCard(tool) {
  const index = tools.indexOf(tool);
  const detailUrl = `/tools/${tool.slug}/`;
  return `<article class="tool-item" data-tool="${index}"><div class="tool-card">
    <span class="card-head">${icon(tool, index)}<span class="card-title"><a class="tool-name" href="${detailUrl}">${escapeHtml(tool.n)}</a><span class="tool-domain">${escapeHtml(hostname(tool.u))}</span></span></span>
    <span class="tool-desc">${escapeHtml(tool.d)}</span>
    <span class="tool-tags"><span class="tool-tag">网页端</span></span>
    <span class="card-foot"><span class="category">${escapeHtml(tool.c)}</span><a class="visit" href="${escapeHtml(tool.u)}" target="_blank" rel="noopener noreferrer">访问官网</a></span>
  </div></article>`;
}
function homepageCatalog() {
  return toolCategories.map((category, categoryIndex) => {
    const items = orderCategoryTools(tools.filter(tool => tool.c === category), category);
    const headingId = `tool-category-${categoryIndex + 1}`;
    return `<section class="tool-group" aria-labelledby="${headingId}">
      <div class="group-heading"><h2 id="${headingId}"><a class="category-page-link" href="/category/${toolCategorySlugs[category]}/">${escapeHtml(category)}</a></h2><span class="group-count">${items.length} 个资源</span><span class="group-line" aria-hidden="true"></span></div>
      <div class="group-grid">${items.map(staticCard).join('')}</div>
    </section>`;
  }).join('');
}
function pageShell({ title, description, canonical, body, jsonLd }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#10141d">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="../../design.css">
  <script type="application/ld+json">${safeJson(jsonLd)}</script>
</head>
<body class="seo-page">
  <header class="seo-header"><a class="seo-brand" href="/">ChemHub</a></header>
  <main class="seo-main">${body}<p class="seo-back"><a href="/privacy.html">隐私政策</a></p></main>
</body>
</html>`;
}
function toolPage(tool) {
  const canonical = `${siteUrl}/tools/${tool.slug}/`;
  const categorySlug = toolCategorySlugs[tool.c];
  const related = orderCategoryTools(tools.filter(item => item.c === tool.c && item.slug !== tool.slug), tool.c);
  const title = `${tool.n} — ${tool.c} | ChemHub`;
  const description = `${tool.n}：${tool.d}查看所属分类与官方网站。`;
  const body = `<nav class="seo-breadcrumb" aria-label="面包屑"><a href="/">ChemHub 首页</a><span>›</span><a href="/category/${categorySlug}/">${escapeHtml(tool.c)}</a></nav>
    <article class="seo-panel">
      <p class="seo-kicker">${escapeHtml(tool.c)}</p>
      <h1>${escapeHtml(tool.n)}</h1>
      <p class="seo-description">${escapeHtml(tool.d)}</p>
      <p><a class="seo-primary" href="${escapeHtml(tool.u)}" target="_blank" rel="noopener noreferrer">访问 ${escapeHtml(tool.n)} 官方网站</a></p>
    </article>
    <section class="seo-related" aria-labelledby="related-title"><h2 id="related-title">同分类相关工具</h2><div class="seo-link-grid">${related.map(item => `<a href="/tools/${item.slug}/"><strong>${escapeHtml(item.n)}</strong><span>${escapeHtml(item.d)}</span></a>`).join('')}</div></section>
    <p class="seo-back"><a href="/">← 返回 ChemHub 首页</a></p>`;
  return pageShell({ title, description, canonical, body, jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: tool.d, url: canonical, isPartOf: { '@type': 'WebSite', name: 'ChemHub', url: `${siteUrl}/` } } });
}
function categoryPage(category) {
  const slug = toolCategorySlugs[category];
  const canonical = `${siteUrl}/category/${slug}/`;
  const items = orderCategoryTools(tools.filter(tool => tool.c === category), category);
  const title = `${category}工具与资源 | ChemHub`;
  const intro = `这里整理 ChemHub 收录的${category}相关工具与资源，方便查找并访问相应的在线服务与科研资源。`;
  const description = `ChemHub ${category}分类收录 ${items.length} 个相关工具与资源，提供工具简介、站内详情页和官方网站入口。`;
  const body = `<nav class="seo-breadcrumb" aria-label="面包屑"><a href="/">ChemHub 首页</a><span>›</span><span>${escapeHtml(category)}</span></nav>
    <header class="seo-panel"><p class="seo-kicker">ChemHub 分类</p><h1>${escapeHtml(category)}</h1><p class="seo-description">${escapeHtml(intro)}</p></header>
    <section class="seo-related" aria-labelledby="category-tools"><h2 id="category-tools">本分类收录工具</h2><div class="seo-link-grid">${items.map(tool => `<article><a class="seo-tool-link" href="/tools/${tool.slug}/"><strong>${escapeHtml(tool.n)}</strong><span>${escapeHtml(tool.d)}</span></a><a class="seo-official" href="${escapeHtml(tool.u)}" target="_blank" rel="noopener noreferrer">访问官网</a></article>`).join('')}</div></section>
    <p class="seo-back"><a href="/">← 返回 ChemHub 首页</a></p>`;
  return pageShell({ title, description, canonical, body, jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: intro, url: canonical, isPartOf: { '@type': 'WebSite', name: 'ChemHub', url: `${siteUrl}/` } } });
}

const sourceIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const gridMarker = '<div id="toolGrid" class="tool-grid" tabindex="-1"></div>';
if (!sourceIndex.includes(gridMarker)) throw new Error('index.html toolGrid marker not found');
const generatedIndex = sourceIndex.replace(gridMarker, `<div id="toolGrid" class="tool-grid" tabindex="-1">${homepageCatalog()}</div>`);
const iconFiles = tools.flatMap((tool, index) => tool.icon === false ? [] : [`assets/icons/${index}.png`]);
const copiedFiles = ['design.css', 'app.js', 'tools.js', 'privacy.html', 'ads.txt', ...iconFiles];
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex');
const outputs = [{ file: 'index.html', data: Buffer.from(generatedIndex) }];
for (const file of copiedFiles) {
  const data = fs.readFileSync(path.join(root, file));
  if (file.endsWith('.png') && !data.subarray(0, 8).equals(pngSignature)) throw new Error(`Not a PNG: ${file}`);
  outputs.push({ file, data });
}
outputs.push({ file: 'robots.txt', data: Buffer.from(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`) });
for (const tool of tools) outputs.push({ file: `tools/${tool.slug}/index.html`, data: Buffer.from(toolPage(tool)) });
for (const category of toolCategories) outputs.push({ file: `category/${toolCategorySlugs[category]}/index.html`, data: Buffer.from(categoryPage(category)) });
const sitemapUrls = [`${siteUrl}/`, `${siteUrl}/privacy.html`, ...tools.map(tool => `${siteUrl}/tools/${tool.slug}/`), ...toolCategories.map(category => `${siteUrl}/category/${toolCategorySlugs[category]}/`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
outputs.push({ file: 'sitemap.xml', data: Buffer.from(sitemap) });

// Validate every input and generated page before replacing a previous successful build.
fs.rmSync(output, { recursive: true, force: true });
for (const { file, data } of outputs) {
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, data);
}
console.log(`Built dist/: ${tools.length} tools, ${toolCategories.length} categories, ${outputs.length} allowlisted/generated files. No tests, documents or source records published.`);
