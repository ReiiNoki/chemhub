const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const catalogSource = fs.readFileSync(path.join(root, 'tools.js'), 'utf8');
const data = JSON.parse(vm.runInNewContext(`${catalogSource}\nJSON.stringify({tools, toolCategories, toolCategorySlugs});`, {}, { timeout: 1000 }));
const { tools: catalog, toolCategories, toolCategorySlugs } = data;
const iconFiles = catalog.flatMap((tool, index) => tool.icon === false ? [] : [`assets/icons/${index}.png`]);
const copiedFiles = ['design.css', 'app.js', 'tools.js', ...iconFiles];
const generatedFiles = [
  'index.html', 'robots.txt', 'sitemap.xml',
  ...catalog.map(tool => `tools/${tool.slug}/index.html`),
  ...toolCategories.map(category => `category/${toolCategorySlugs[category]}/index.html`)
];
const expectedFiles = [...copiedFiles, ...generatedFiles].sort();
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'chemhub-build-test-'));
const output = path.join(fixture, 'dist');
const siteUrl = 'https://chemhub.dpdns.org';

assert.ok(catalog.every(tool => typeof tool.slug === 'string' && tool.slug.length), 'Every tool has a slug');
assert.equal(new Set(catalog.map(tool => tool.slug)).size, catalog.length, 'Tool slugs are unique');
assert.ok(catalog.every(tool => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug)), 'Tool slugs use lowercase URL-safe characters');
assert.equal(new Set(toolCategories.map(category => toolCategorySlugs[category])).size, toolCategories.length, 'Category slugs are complete and unique');

function listFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), `${name}/`) : [name];
  }).sort();
}
function build() {
  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts/build.cjs')], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 10000 });
  if (result.error) throw result.error;
  return result;
}
function assertOutput() {
  assert.deepEqual(listFiles(output), expectedFiles, 'Only allowlisted runtime assets and generated SEO files are published');
  for (const file of copiedFiles) {
    const expected = fs.readFileSync(path.join(fixture, file));
    assert.ok(fs.readFileSync(path.join(output, file)).equals(expected), `${file} copied unchanged`);
  }
  for (const forbidden of ['README.md', 'docs', 'tests', '.git', 'assets/icons/sources.json']) {
    assert.equal(fs.existsSync(path.join(output, forbidden)), false, `${forbidden} is not published`);
  }
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function assertSeoOutput() {
  const home = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  assert.match(home, /<link rel="canonical" href="https:\/\/chemhub\.dpdns\.org\/">/);
  assert.ok(catalog.every(tool => home.includes(`>${escapeHtml(tool.n)}</a>`)), 'Homepage HTML contains every tool name without executing JavaScript');
  assert.ok(toolCategories.every(category => home.includes(`>${category}</a>`)), 'Homepage HTML contains every category heading');
  assert.ok(catalog.every(tool => home.includes(`/tools/${tool.slug}/`)), 'Homepage links to every internal tool page');
  assert.ok(catalog.every(tool => home.includes(escapeHtml(tool.d)) && home.includes(escapeHtml(tool.u))), 'Homepage contains descriptions and official URLs');
  assert.match(home, /<div id="toolGrid"[^>]*><section class="tool-group"/, 'toolGrid has build-time body content');

  const robots = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*\nAllow: \/\n/m);
  assert.match(robots, /Sitemap: https:\/\/chemhub\.dpdns\.org\/sitemap\.xml/);
  const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
  const urls = [`${siteUrl}/`, ...catalog.map(tool => `${siteUrl}/tools/${tool.slug}/`), ...toolCategories.map(category => `${siteUrl}/category/${toolCategorySlugs[category]}/`)];
  assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(urls.every(url => sitemap.includes(`<loc>${url}</loc>`)), 'Sitemap includes home, every tool page and every category page');
  assert.equal((sitemap.match(/<url>/g) || []).length, urls.length, 'Sitemap has no missing or extra URLs');
  assert.doesNotMatch(sitemap, /<lastmod>/, 'No fabricated lastmod values');

  for (const tool of catalog) {
    const file = path.join(output, 'tools', tool.slug, 'index.html');
    assert.ok(fs.existsSync(file), `${tool.slug} detail page exists`);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<html lang="zh-CN">/);
    assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}/tools/${tool.slug}/">`), `${tool.slug} canonical`);
    assert.ok(html.includes(`<h1>${escapeHtml(tool.n)}</h1>`), `${tool.slug} h1`);
    assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'), `${tool.slug} safe official link`);
  }
  for (const category of toolCategories) {
    const slug = toolCategorySlugs[category];
    const file = path.join(output, 'category', slug, 'index.html');
    assert.ok(fs.existsSync(file), `${slug} category page exists`);
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}/category/${slug}/">`), `${slug} canonical`);
    assert.ok(html.includes(`<h1>${category}</h1>`), `${slug} h1`);
    for (const tool of catalog.filter(tool => tool.c === category)) assert.ok(html.includes(`/tools/${tool.slug}/`), `${slug} links ${tool.slug}`);
  }
}

try {
  for (const file of ['index.html', ...copiedFiles, 'scripts/build.cjs']) {
    const destination = path.join(fixture, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, file), destination);
  }
  const excludedIcons = catalog.flatMap((tool, index) => tool.icon === false ? [`assets/icons/${index}.png`] : []);
  for (const file of ['.env', '.gitignore', 'README.md', 'unpublished-extra.html', 'tests/private.txt', 'assets/icons/sources.json', `assets/icons/${catalog.length}.png`, ...excludedIcons]) {
    const destination = path.join(fixture, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, 'Must not be published');
  }
  let result = build();
  assert.equal(result.status, 0, result.stderr);
  assertOutput();
  assertSeoOutput();

  fs.writeFileSync(path.join(output, 'stale-file.txt'), 'Must disappear on rebuild');
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assertOutput();
  assertSeoOutput();

  // Explicit text-only mode works without a PNG and never publishes an orphan icon.
  const textOnlySource = `${catalogSource}\ntools[0].icon = false;\n`;
  fs.writeFileSync(path.join(fixture, 'tools.js'), textOnlySource);
  fs.unlinkSync(path.join(fixture, 'assets/icons/0.png'));
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(listFiles(output), expectedFiles.filter(file => file !== 'assets/icons/0.png'));
  assert.equal(fs.existsSync(path.join(output, 'assets/icons/0.png')), false);
  assertSeoOutput();
  fs.writeFileSync(path.join(fixture, 'assets/icons/0.png'), '<html>Excluded icons are not validated or published</html>');
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(output, 'assets/icons/0.png')), false);

  fs.copyFileSync(path.join(root, 'assets/icons/0.png'), path.join(fixture, 'assets/icons/0.png'));
  fs.writeFileSync(path.join(fixture, 'tools.js'), catalogSource);
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assertOutput();
  assertSeoOutput();

  const successfulSnapshot = new Map(listFiles(output).map(file => [file, fs.readFileSync(path.join(output, file))]));
  for (const [mutation, message] of [
    ['tools[0].icon = null;', 'Only explicit boolean icon modes are accepted'],
    ["tools[0].slug = 'INVALID SLUG';", 'Invalid slugs fail the build'],
    ["tools[1].slug = tools[0].slug;", 'Duplicate slugs fail the build']
  ]) {
    fs.writeFileSync(path.join(fixture, 'tools.js'), `${catalogSource}\n${mutation}\n`);
    result = build();
    assert.notEqual(result.status, 0, message);
    assert.deepEqual(listFiles(output), [...successfulSnapshot.keys()], 'Failed validation preserves the previous build');
    for (const [file, bytes] of successfulSnapshot) assert.ok(fs.readFileSync(path.join(output, file)).equals(bytes), `${file} preserved after failure`);
  }

  fs.writeFileSync(path.join(fixture, 'tools.js'), catalogSource);
  fs.unlinkSync(path.join(fixture, 'assets/icons/0.png'));
  result = build();
  assert.notEqual(result.status, 0, 'Missing required icons fail the build');
  for (const [file, bytes] of successfulSnapshot) assert.ok(fs.readFileSync(path.join(output, file)).equals(bytes), `${file} preserved after missing icon`);
  fs.writeFileSync(path.join(fixture, 'assets/icons/0.png'), '<html>Not an icon</html>');
  result = build();
  assert.notEqual(result.status, 0, 'Misnamed non-PNG icons fail the build');
  assert.match(result.stderr, /Not a PNG/);
  for (const [file, bytes] of successfulSnapshot) assert.ok(fs.readFileSync(path.join(output, file)).equals(bytes), `${file} preserved after invalid icon`);

  console.log(`PASS SEO static build: ${catalog.length} unique tool slugs, ${toolCategories.length} categories, prerendered homepage, detail/category pages, canonical URLs, robots, complete sitemap, strict allowlist and failure-safe validation`);
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
