// Post-deploy smoke test for the actual published origin; no third-party dependencies.
const assert = require('node:assert/strict');

const origin = new URL(process.argv[2] || 'https://chemhub.dpdns.org/');
if (!['https:', 'http:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('Provide a site origin, e.g. https://chemhub.dpdns.org/');
}

async function get(path) {
  const url = new URL(path, origin);
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
  return { url: response.url, status: response.status, body: await response.text() };
}

(async () => {
  const [home, tool, category, sitemap, robots, privacy, adsTxt, privateDoc, privateTest] = await Promise.all([
    get('/'), get('/tools/sdbs/'), get('/category/spectroscopy/'), get('/sitemap.xml'),
    get('/robots.txt'), get('/privacy.html'), get('/ads.txt'), get('/docs/MAINTENANCE.md'), get('/tests/build.cjs')
  ]);
  assert.equal(home.status, 200, 'Homepage must return 200');
  assert.match(home.body, /href="\/tools\/sdbs\/">SDBS<\/a>/, 'Homepage is serving source index.html; set the deployed output/assets directory to dist/');
  assert.equal(tool.status, 200, `Tool detail must exist at /tools/sdbs/ (not /dist/tools/sdbs/); got ${tool.status}`);
  assert.match(tool.body, /<h1>SDBS<\/h1>/);
  assert.equal(category.status, 200, `Category must exist at /category/spectroscopy/; got ${category.status}`);
  assert.match(category.body, /<h1>光谱分析<\/h1>/);
  assert.equal(sitemap.status, 200, 'Sitemap must exist at /sitemap.xml');
  assert.match(sitemap.body, /<loc>https:\/\/chemhub\.dpdns\.org\/tools\/sdbs\/<\/loc>/);
  assert.equal(robots.status, 200, 'Robots file must exist at /robots.txt');
  assert.equal(privacy.status, 200, 'Privacy policy must exist at /privacy.html');
  assert.match(privacy.body, /<h1>隐私政策<\/h1>/);
  assert.equal(adsTxt.status, 200, 'AdSense ads.txt must exist at /ads.txt');
  assert.equal(adsTxt.body.trim(), 'google.com, pub-5604621379037055, DIRECT, f08c47fec0942fa0');
  assert.equal(privateDoc.status, 404, 'docs/ must not be published');
  assert.equal(privateTest.status, 404, 'tests/ must not be published');
  console.log(`PASS deployment: ${origin.href} serves built HTML, detail/category pages, privacy, ads.txt, sitemap and robots; private source excluded`);
})().catch(error => { console.error(`FAIL deployment at ${origin.href}: ${error.message}`); process.exitCode = 1; });
