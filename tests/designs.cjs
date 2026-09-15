/* Run: PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/designs.cjs
   Or install Playwright in your test environment and run node tests/designs.cjs.
   Uses an installed Chrome by default; set BROWSER_CHANNEL for another channel. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assertCategoryCollapse = require('./category-collapse.cjs');
const assertAdLayout = require('./ad-layout.cjs');
const assertPinnedTools = require('./pinned-tools.cjs');
const root = path.resolve(__dirname, '..');
const catalogSource = fs.readFileSync(path.join(root, 'tools.js'), 'utf8');
const { tools: catalog, toolCategories: categoryNames } = JSON.parse(vm.runInNewContext(`${catalogSource}\nJSON.stringify({tools, toolCategories});`));
const totalTools = catalog.length;
const totalIcons = catalog.filter(tool => tool.icon !== false).length;
const journalPlatforms = [
  [31, 'ACS Publications', 'https://pubs.acs.org/'],
  [32, 'RSC Publishing', 'https://pubs.rsc.org/'],
  [33, 'ScienceDirect · Elsevier', 'https://www.sciencedirect.com/'],
  [34, 'Wiley Online Library', 'https://onlinelibrary.wiley.com/'],
  [35, 'Springer Nature Link', 'https://link.springer.com/'],
  [36, 'Nature', 'https://www.nature.com/'],
  [37, 'Science', 'https://www.science.org/']
];
const addedSuppliers = [
  [38, 'TCI Chemicals', 'https://www.tcichemicals.com/'],
  [39, 'Thermo Fisher Scientific', 'https://www.thermofisher.com/'],
  [40, '富士和光 Wako', 'https://labchem-wako.fujifilm.com/asia/index.html'],
  [41, '关东化学 Kanto', 'https://www.kanto.co.jp/english/'],
  [42, 'Strem', 'https://www.strem.com/'],
  [43, 'Fluorochem', 'https://fluorochem.co.uk/'],
  [44, 'Cambridge Isotope Laboratories', 'https://isotope.com/']
];
const suppliers = [
  [26, 'Sigma-Aldrich', 'https://www.sigmaaldrich.cn/CN/zh'],
  [27, '阿拉丁试剂', 'https://www.aladdin-e.com/'],
  [28, '麦克林试剂', 'https://www.macklin.cn/'],
  ...addedSuppliers
];
const researchGroups = [
  [45, 'MacMillan Group', 'https://macmillan.princeton.edu/'],
  [46, 'Baran Lab', 'https://baranlab.org/'],
  [47, 'Hartwig Group', 'https://hartwig.cchem.berkeley.edu/'],
  [48, 'Houk Group', 'https://www.chem.ucla.edu/houk/'],
  [49, 'Yaghi Group', 'https://yaghi.berkeley.edu/'],
  [50, 'Arnold Group', 'http://fhalab.caltech.edu/'],
  [51, '游书力课题组', 'http://shuliyou.sioc.ac.cn/'],
  [52, '冯小明课题组 · ASL', 'https://www.scu.edu.cn/chem_asl/'],
  [53, '杨震课题组', 'https://www.chem.pku.edu.cn/zyang/'],
  [54, '雷晓光课题组', 'https://www.chem.pku.edu.cn/leigroup/'],
  [55, '唐勇课题组', 'https://tangyong.sioc.ac.cn/'],
  [56, '龚流柱课题组', 'http://staff.ustc.edu.cn/~gonglz/'],
  [57, '裴坚–王婕妤课题组', 'https://www.chem.pku.edu.cn/pei/zwsy/index.htm'],
  [58, '井上将行 Inoue', 'https://inoue.f.u-tokyo.ac.jp/e_index.html'],
  [59, '伊丹健一郎 Itami', 'https://itami-lab.com/?lang=en'],
  [60, '伊藤肇 Ito', 'https://itogrouphp.eng.hokudai.ac.jp/en.html'],
  [61, '前田理 Maeda · 理论化学', 'https://afir.sci.hokudai.ac.jp/theochem/en/'],
  [62, '山口茂弘 Yamaguchi', 'http://orgreact.chem.nagoya-u.ac.jp/en/index.html'],
  [63, '横岛聪 Yokoshima', 'https://www.ps.nagoya-u.ac.jp/lab_pages/natural_products/']
];
const sciHub = [65, 'Sci-Hub', 'https://sci-hub.shop/'];
const molAid = [71, '摩熵化学 MolAid', 'https://chem.molaid.com/home'];
const referenceResolver = [72, 'Chemistry Reference Resolver', 'https://chemsearch.kovsky.net/'];
const publishers = [
  [73, 'MDPI', 'https://www.mdpi.com/'],
  [74, 'Thieme Connect', 'https://www.thieme-connect.com/products'],
  [75, 'Taylor & Francis Online', 'https://www.tandfonline.com/']
];
const literature = [
  referenceResolver,
  [18, 'Web of Science', 'https://www.webofscience.com/'],
  [19, 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/'],
  [20, 'Google Scholar', 'https://scholar.google.com/'],
  [21, '中国知网 CNKI', 'https://www.cnki.net/'],
  [22, 'Espacenet', 'https://worldwide.espacenet.com/'],
  sciHub
];
const journals = [...journalPlatforms, ...publishers];
const journalIcons = journals.filter(([index]) => catalog[index].icon !== false).length;
const communities = [
  [66, '小木虫', 'https://muchong.com/bbs/'],
  [67, '化学空间 Chem-Station', 'https://cn.chem-station.com/'],
  [68, 'Chemistry Stack Exchange', 'https://chemistry.stackexchange.com/'],
  [69, 'ChemistryViews', 'https://www.chemistryviews.org/'],
  [70, 'Chemistry World', 'https://www.chemistryworld.com/']
];
const mechanismProblems = [64, '福山–横岛机理习题', 'https://www.ps.nagoya-u.ac.jp/lab_pages/natural_products/problem-e.html'];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
async function assertIcons(page, selector, expectedCount) {
  const icons = await page.locator(selector).evaluateAll(images => Promise.all(images.map(image => {
    image.loading = 'eager';
    return image.decode().then(
      () => ({ src: image.getAttribute('src'), decoded: image.naturalWidth > 0 && image.naturalHeight > 0 }),
      () => ({ src: image.getAttribute('src'), decoded: false })
    );
  })));
  assert.equal(icons.length, expectedCount, `${selector}: all icon elements present`);
  assert.ok(icons.every(icon => icon.decoded), `All local icons decode: ${JSON.stringify(icons.filter(icon => !icon.decoded))}`);
}
async function assertResourceLinks(page, selector, expected) {
  const links = await page.locator(selector).evaluateAll(items => items.map(link => ({
    name: link.querySelector('.tool-name, .resource-title h3').textContent,
    href: link.getAttribute('href'),
    icon: link.querySelector('img')?.getAttribute('src') ?? null,
    target: link.target,
    rel: link.rel
  })));
  assert.deepEqual(links, expected.map(([index, name, href]) => ({
    name, href, icon: catalog[index].icon === false ? null : `assets/icons/${index}.png`, target: '_blank', rel: 'noopener noreferrer'
  })), 'Resource names, configured URLs and stable favicon indexes/text-only modes');
}
async function assertJournalSearch(page, cardSelector, titleSelector) {
  for (const [query, name] of [
    ['aCs', 'ACS Publications'], ['rSc', 'RSC Publishing'],
    ['Elsevier', 'ScienceDirect · Elsevier'], ['爱思唯尔', 'ScienceDirect · Elsevier'],
    ['施普林格', 'Springer Nature Link'], ['JACS', 'ACS Publications'],
    ['Angewandte', 'Wiley Online Library']
  ]) {
    await page.locator('#search').fill(query);
    assert.equal(await page.locator(cardSelector).count(), 1, `${query}: one matching journal platform`);
    assert.equal(await page.locator(titleSelector).textContent(), name);
  }
  await page.locator('#search').fill('');
}
async function assertPublisherSearch(page, linkSelector, included = true) {
  for (const [query, index] of [
    ['mDpI', 0], ['Molecules', 0], ['Catalysts', 0],
    ['tHiEmE', 1], ['蒂默', 1], ['sYnLeTt', 1],
    ['tAyLoR & fRaNcIs', 2], ['T&F', 2], ['泰勒', 2]
  ]) {
    await page.locator('#search').fill(query);
    await assertResourceLinks(page, linkSelector, included ? [publishers[index]] : []);
  }
  await page.locator('#search').fill('');
}
async function assertPublisherCards(page, linkSelector) {
  for (const [index, name, url] of publishers) {
    const link = page.locator(`${linkSelector}[href="${url}"]`);
    const logo = link.locator('.tool-logo, .resource-logo');
    assert.equal(await logo.isVisible(), true, `${name}: visible identity`);
    if (catalog[index].icon === false) {
      assert.equal(await logo.locator('img').count(), 0, `${name}: no fabricated or missing image`);
      assert.equal(await logo.innerText(), catalog[index].i, `${name}: deliberate text fallback`);
    } else {
      await assertIcons(link, 'img', 1);
    }
  }
}
async function assertSupplierSearch(page, cardSelector, titleSelector) {
  for (const [query, name] of [
    ['tCi', 'TCI Chemicals'], ['东京化成', 'TCI Chemicals'],
    ['tHeRmO', 'Thermo Fisher Scientific'], ['赛默飞', 'Thermo Fisher Scientific'],
    ['wAkO', '富士和光 Wako'], ['FUJIFILM', '富士和光 Wako'], ['富士和光', '富士和光 Wako'],
    ['kAnTo', '关东化学 Kanto'], ['关东化学', '关东化学 Kanto'],
    ['sTrEm', 'Strem'], ['fLuOrOcHeM', 'Fluorochem'],
    ['cil', 'Cambridge Isotope Laboratories'], ['剑桥', 'Cambridge Isotope Laboratories'],
    ['氘代', 'Cambridge Isotope Laboratories'], ['NMR', 'Cambridge Isotope Laboratories']
  ]) {
    await page.locator('#search').fill(query);
    assert.equal(await page.locator(cardSelector).count(), 1, `${query}: one matching supplier`);
    assert.equal(await page.locator(titleSelector).textContent(), name);
  }
  await page.locator('#search').fill('');
}
async function assertGroupSearch(page, cardSelector, titleSelector) {
  for (const [query, name] of [
    ['mAcMiLlAn', 'MacMillan Group'], ['bArAn', 'Baran Lab'], ['hArTwIg', 'Hartwig Group'],
    ['UCLA', 'Houk Group'], ['MOF', 'Yaghi Group'], ['aRnOlD', 'Arnold Group'],
    ['Shu-Li You', '游书力课题组'], ['Xiaoming Feng', '冯小明课题组 · ASL'],
    ['杨震', '杨震课题组'], ['Zhen Yang', '杨震课题组'],
    ['雷晓光', '雷晓光课题组'], ['Xiaoguang Lei', '雷晓光课题组'],
    ['Yong Tang', '唐勇课题组'], ['龚流柱', '龚流柱课题组'],
    ['王婕妤', '裴坚–王婕妤课题组'], ['iNoUe', '井上将行 Inoue'],
    ['RIKEN', '伊丹健一郎 Itami'], ['Hajime Ito', '伊藤肇 Ito'],
    ['AFIR', '前田理 Maeda · 理论化学'], ['yAmAgUcHi', '山口茂弘 Yamaguchi'],
    ['Yokoshima', '横岛聪 Yokoshima'], ['福山', '横岛聪 Yokoshima']
  ]) {
    await page.locator('#search').fill(query);
    assert.equal(await page.locator(cardSelector).count(), 1, `${query}: one matching research group`);
    assert.equal(await page.locator(titleSelector).textContent(), name);
  }
  await page.locator('#search').fill('北京大学');
  assert.deepEqual(await page.locator(titleSelector).allTextContents(), ['杨震课题组', '雷晓光课题组', '裴坚–王婕妤课题组']);
  await page.locator('#search').fill('日本');
  assert.equal(await page.locator(cardSelector).count(), 6, 'Six Japanese group sites including Yokoshima');
  await page.locator('#search').fill('氘代');
  assert.equal(await page.locator(cardSelector).count(), 0, 'Groups do not leak supplier results');
  await page.locator('#search').fill('');
}
async function assertProblemSearch(page, cardSelector, titleSelector) {
  for (const query of ['福山', 'fUkUyAmA', 'Yokoshima', '机理习题']) {
    await page.locator('#search').fill(query);
    assert.equal(await page.locator(cardSelector).count(), 1, `${query}: one learning resource`);
    assert.equal(await page.locator(titleSelector).textContent(), mechanismProblems[1]);
  }
  await page.locator('#search').fill('');
}
async function assertSciHubSearch(page, linkSelector) {
  for (const query of ['Sci-Hub', 'scihub', 'ScIhUb']) {
    await page.locator('#search').fill(query);
    await assertResourceLinks(page, linkSelector, [sciHub]);
  }
  await page.locator('#search').fill('');
}
async function assertCommunitySearch(page, linkSelector) {
  for (const [query, index] of [
    ['小木虫', 0], ['mUcHoNg', 0], ['化学空间', 1],
    ['cHeM-sTaTiOn', 1], ['chemstation', 1], ['Chem Station', 1],
    ['sTaCk eXcHaNgE', 2], ['ChemistryViews', 3], ['Chemistry Europe', 3],
    ['Chemistry World', 4], ['订阅', 4]
  ]) {
    await page.locator('#search').fill(query);
    await assertResourceLinks(page, linkSelector, [communities[index]]);
  }
  await page.locator('#search').fill('氘代');
  await assertResourceLinks(page, linkSelector, []);
  await page.locator('#search').fill('社区与资讯');
  await assertResourceLinks(page, linkSelector, communities);
  await page.locator('#search').fill('');
}
async function assertMolAidSearch(page, linkSelector) {
  for (const query of ['摩熵', 'mOlAiD', '合成设计']) {
    await page.locator('#search').fill(query);
    await assertResourceLinks(page, linkSelector, [molAid]);
  }
  await page.locator('#search').fill('');
}
async function assertReferenceResolverSearch(page, linkSelector, expected = [referenceResolver]) {
  for (const query of ['Chemistry Reference Resolver', 'rEfErEnCe ReSoLvEr', '引用解析', '卷页']) {
    await page.locator('#search').fill(query);
    await assertResourceLinks(page, linkSelector, expected);
  }
  await page.locator('#search').fill('');
}
let browser;
(async () => {
  const orderReport = JSON.parse(vm.runInNewContext(`${catalogSource}
    const snapshot = JSON.stringify(tools);
    const input = Object.freeze(tools.filter(tool => tool.c === '文献专利搜索'));
    const ordered = orderCategoryTools(input, '文献专利搜索');
    const filtered = orderCategoryTools(Object.freeze(input.filter(tool => tool.n === 'Web of Science')), '文献专利搜索');
    const journalOrder = orderCategoryTools(Object.freeze(tools.filter(tool => tool.c === '学术期刊')), '学术期刊');
    const unchanged = orderCategoryTools(Object.freeze([...tools]), '未配置分类');
    const empty = orderCategoryTools(Object.freeze([]), '文献专利搜索');
    JSON.stringify({
      ordered: ordered.map(tool => tools.indexOf(tool)),
      filtered: filtered.map(tool => tools.indexOf(tool)),
      journalOrder: journalOrder.map(tool => tools.indexOf(tool)),
      unchanged: unchanged.map(tool => tools.indexOf(tool)),
      empty,
      sourceUnchanged: snapshot === JSON.stringify(tools)
    });`, {}, { timeout: 1000 }));
  assert.deepEqual(orderReport.ordered, literature.map(([index]) => index), 'Resolver keeps first place in literature search without reordering other resources');
  assert.deepEqual(orderReport.filtered, [18], 'Pinning never inserts a filtered-out resource');
  assert.deepEqual(orderReport.journalOrder, journals.map(([index]) => index), 'Journal platforms retain their original order without the resolver');
  assert.equal(categoryNames.includes('文献专利'), false, 'The old category is not duplicated');
  assert.deepEqual(orderReport.unchanged, catalog.map((tool, index) => index), 'Unconfigured categories retain their order');
  assert.deepEqual(orderReport.empty, []);
  assert.equal(orderReport.sourceUnchanged, true, 'Display sorting never mutates the source array or records');
  console.log('PASS display priorities: resolver first, stable identities, frozen inputs, filtered/empty results, unchanged source and other ordering');
  assert.equal(catalog.filter(tool => tool.c === '化学研究课题组主页').length, researchGroups.length);
  assert.equal(catalog[mechanismProblems[0]].c, '学习资源', 'Fukuyama archive is not a current Fukuyama lab');
  assert.doesNotMatch(catalog[mechanismProblems[0]].d, /每周更新|现役|东京大学/);
  assert.ok(!catalog.some(tool => /马大为|施章杰|金井求/.test(tool.n)), 'Excluded or deferred groups are not silently included');
  for (let i = 0; i < totalTools; i++) {
    if (catalog[i].icon === false) {
      assert.equal(fs.existsSync(path.join(root, `assets/icons/${i}.png`)), false, `${i}: pending icons are not replaced with fake PNGs`);
      continue;
    }
    const data = fs.readFileSync(path.join(root, `assets/icons/${i}.png`));
    assert.ok(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${i}.png: real PNG, not a renamed SVG/ICO or an error page`);
  }
  const sources = JSON.parse(fs.readFileSync(path.join(root, 'assets/icons/sources.json'), 'utf8'));
  const sciHubIcon = sources.addedIcons.find(record => record.file === '65.png');
  assert.equal(sciHubIcon.source, 'https://sci-hub.shop/icon.png', 'Sci-Hub uses the target page crow icon, not the old .ru red star');
  assert.equal(sciHubIcon.declaredAt, sciHub[2]);
  for (const record of [...sources.repairedIcons, ...sources.addedIcons]) {
    const data = fs.readFileSync(path.join(root, 'assets/icons', record.file));
    assert.equal(catalog[parseInt(record.file, 10)].n, record.tool, `${record.file}: source record matches tool index`);
    assert.equal(createHash('sha256').update(data).digest('hex'), record.sha256, `${record.file}: source checksum`);
  }
  const addedResources = [...journalPlatforms, ...addedSuppliers, ...researchGroups, mechanismProblems, sciHub, ...communities, molAid, referenceResolver, ...publishers];
  const addedImageResources = addedResources.filter(([index]) => catalog[index].icon !== false);
  for (const [index, name, url] of publishers) {
    assert.deepEqual([catalog[index].n, catalog[index].u, catalog[index].c], [name, url, '学术期刊']);
    assert.doesNotMatch(catalog[index].d, /全部免费|无限/);
  }
  assert.deepEqual(sources.pendingIcons.map(record => [record.index, record.tool, record.homepage, record.fallback]), catalog.flatMap((tool, index) => tool.icon === false ? [[index, tool.n, tool.u, tool.i]] : []), 'Text-only modes have explicit pending provenance');
  assert.ok(sources.pendingIcons.every(record => !('sha256' in record) && !('source' in record) && record.reason && Number.isFinite(Date.parse(record.attemptedAt))), 'Pending icons do not claim downloaded files or checksums');
  assert.deepEqual([catalog[referenceResolver[0]].n, catalog[referenceResolver[0]].u, catalog[referenceResolver[0]].c], [referenceResolver[1], referenceResolver[2], '文献专利搜索']);
  assert.match(catalog[referenceResolver[0]].d, /全文权限依出版商/);
  const resolverIcon = sources.addedIcons.find(record => record.file === '72.png');
  assert.equal(resolverIcon.source, 'https://chemsearch.kovsky.net/favicon.ico');
  assert.equal(resolverIcon.declaredAt, referenceResolver[2]);
  assert.equal(resolverIcon.kind, 'favicon');
  assert.deepEqual([catalog[molAid[0]].n, catalog[molAid[0]].u, catalog[molAid[0]].c], [molAid[1], molAid[2], '化合物数据库']);
  assert.doesNotMatch(catalog[molAid[0]].d, /顶尖|无限|全部免费/);
  const molAidIcon = sources.addedIcons.find(record => record.file === '71.png');
  assert.equal(molAidIcon.source, 'https://chem.molaid.com/imgs/favicon.ico');
  assert.equal(molAidIcon.declaredAt, molAid[2]);
  assert.equal(molAidIcon.kind, 'favicon');
  assert.equal(catalog[sciHub[0]].c, '文献专利搜索');
  assert.equal(catalog.filter(tool => tool.c === '社区与资讯').length, communities.length);
  for (const [index, name, url] of communities) {
    assert.deepEqual([catalog[index].n, catalog[index].u, catalog[index].c], [name, url, '社区与资讯']);
  }
  assert.equal(sources.addedIcons.find(record => record.file === '67.png').kind, 'site-logo', 'Chem-Station uses its own logo, not the default WordPress favicon');
  assert.equal(sources.addedIcons.find(record => record.file === '69.png').kind, 'cached-favicon', 'ChemistryViews cache provenance is explicit');
  assert.deepEqual(sources.addedIcons.map(record => record.file), addedImageResources.map(([index]) => `${index}.png`));
  for (const [index] of addedImageResources) {
    const data = fs.readFileSync(path.join(root, `assets/icons/${index}.png`));
    assert.equal(data.readUInt32BE(16), 32, `${index}.png: 32px width`);
    assert.equal(data.readUInt32BE(20), 32, `${index}.png: 32px height`);
  }
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const externalRequests = [], pendingIconRequests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && url.origin !== base) externalRequests.push(request.url());
    const match = url.pathname.match(/\/assets\/icons\/(\d+)\.png$/);
    if (match && catalog[Number(match[1])]?.icon === false) pendingIconRequests.push(request.url());
  });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (/^https?:/.test(url) && new URL(url).origin !== base) return route.abort();
    return route.continue();
  });
  await page.route('**/assets/icons/31.png', route => route.abort());
  await page.goto(`${base}/index.html`);
  // Exercise expanded cards below; fresh/default-collapsed behavior has its own tests.
  while (await page.locator('.group-toggle[aria-expanded="false"]').count()) {
    await page.locator('.group-toggle[aria-expanded="false"]').first().click();
  }
  const acsLogo = page.getByRole('link', { name: '打开 ACS Publications', exact: true }).locator('.tool-logo');
  await acsLogo.scrollIntoViewIfNeeded();
  await acsLogo.locator('img').waitFor({ state: 'detached' });
  assert.equal(await acsLogo.innerText(), 'ACS', 'New journals retain monogram fallback');
  await page.unroute('**/assets/icons/31.png');
  for (const [index, name, monogram] of [[53, '杨震课题组', 'YZ'], [64, mechanismProblems[1], 'FY'], [65, 'Sci-Hub', 'SH'], [66, '小木虫', '木'], [67, '化学空间 Chem-Station', 'CS'], [molAid[0], molAid[1], 'MA'], [referenceResolver[0], referenceResolver[1], 'CRR']]) {
    await page.route(`**/assets/icons/${index}.png`, route => route.abort());
    await page.goto(`${base}/index.html`);
    const logo = page.getByRole('link', { name: `打开 ${name}`, exact: true }).locator('.tool-logo');
    await logo.scrollIntoViewIfNeeded();
    await logo.locator('img').waitFor({ state: 'detached' });
    assert.equal(await logo.innerText(), monogram, `${name}: local monogram fallback`);
    await page.unroute(`**/assets/icons/${index}.png`);
  }
  await page.goto(`${base}/index.html`);
  assert.equal(await page.locator('.tool-card').count(), totalTools);
  await assertIcons(page, '.tool-logo img', totalIcons);
  const expectedGroups = [
    ['结构绘制', 3], ['化合物数据库', 6], ['合成化学', 5],
    ['计算工具', 3], ['光谱分析', 2], ['文献专利搜索', literature.length],
    ['学术期刊', journals.length], ['化学研究课题组主页', researchGroups.length], ['社区与资讯', communities.length], ['科研绘图', 3], ['试剂采购', 10], ['学习资源', 3]
  ];
  const groupedCards = await page.locator('.tool-group').evaluateAll(groups => groups.map(group => ({
    name: group.querySelector('h2').textContent,
    count: group.querySelectorAll('.tool-card').length,
    labelCount: parseInt(group.querySelector('.group-count').textContent, 10),
    accessible: group.getAttribute('aria-labelledby') === group.querySelector('h2').id,
    matches: [...group.querySelectorAll('.tool-card .category')].every(label => label.textContent === group.querySelector('h2').textContent)
  })));
  assert.deepEqual(groupedCards.map(group => [group.name, group.count]), expectedGroups, 'Category order and complete tool membership');
  assert.ok(groupedCards.every(group => group.count === group.labelCount && group.accessible && group.matches), 'Correct labels and semantic category headings');
  assert.equal(new Set(await page.locator('.tool-card').evaluateAll(cards => cards.map(card => card.href))).size, totalTools, 'No duplicated tools');
  const nmrColor = await page.getByRole('link', { name: '打开 NMRDB', exact: true }).locator('.tool-logo').evaluate(el => el.style.getPropertyValue('--icon-bg'));
  for (const view of ['grid', 'list']) {
    if (view === 'list') await page.locator('#viewToggle').click();
    for (const width of [320, 390, 580, 581, 768, 900, 901, 1100, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `dark/${view}/${width}: no overflow`);
      const expectedColumns = view === 'list' || width <= 580 ? 1 : width <= 900 ? 2 : 3;
      const groupColumns = await page.locator('.group-grid').evaluateAll(groups => groups.map(group => getComputedStyle(group).gridTemplateColumns.split(' ').length));
      assert.ok(groupColumns.every(columns => columns === expectedColumns), `dark/${view}/${width}: responsive category grids`);
      await assertResourceLinks(page, '.tool-group:has([data-group-toggle="学术期刊"]) .tool-card', journals);
      await assertResourceLinks(page, '.tool-group:has([data-group-toggle="文献专利搜索"]) .tool-card', literature);
      const geometry = await page.locator('.tool-card').evaluateAll(cards => cards.map(card => {
        const rect = card.getBoundingClientRect();
        const logo = card.querySelector('.tool-logo').getBoundingClientRect();
        const image = card.querySelector('.tool-logo img');
        const imageStyle = image && getComputedStyle(image);
        return {
          height: rect.height,
          logoWidth: logo.width,
          logoHeight: logo.height,
          faviconSize: imageStyle ? image.clientWidth - parseFloat(imageStyle.paddingLeft) - parseFloat(imageStyle.paddingRight) : null,
          contained: ['.card-head', '.tool-desc', '.card-foot'].every(selector => {
            const child = card.querySelector(selector).getBoundingClientRect();
            return child.left >= rect.left && child.right <= rect.right + .5 && child.top >= rect.top && child.bottom <= rect.bottom + .5;
          })
        };
      }));
      assert.ok(geometry.every(item => item.logoWidth === 32 && item.logoHeight === 32), `dark/${view}/${width}: compact icons`);
      assert.ok(geometry.every(item => item.faviconSize === null || item.faviconSize === 16), `dark/${view}/${width}: native-size favicons`);
      assert.ok(geometry.every(item => item.contained), `dark/${view}/${width}: card content contained`);
      if (view === 'grid' && width >= 1440) assert.ok(geometry.every(item => item.height < 220), 'Compact desktop cards');
    }
  }
  await page.locator('#viewToggle').click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#searchToggle').click();
  await page.locator('#search').fill('NMR');
  assert.equal(await page.locator('.tool-card').count(), 2);
  assert.deepEqual(await page.locator('.tool-name').allTextContents(), ['NMRDB', 'Cambridge Isotope Laboratories']);
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['光谱分析', '试剂采购']);
  assert.deepEqual(await page.locator('.group-count').allTextContents(), ['1 个资源', '1 个资源']);
  assert.equal(await page.getByRole('link', { name: '打开 NMRDB', exact: true }).locator('.tool-logo').evaluate(el => el.style.getPropertyValue('--icon-bg')), nmrColor, 'Stable favicon fallback color after filtering');
  await page.locator('#search').fill('光谱');
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['化合物数据库', '光谱分析']);
  assert.deepEqual(await page.locator('.group-count').allTextContents(), ['1 个资源', '2 个资源']);
  await page.locator('#search').fill('not-a-real-tool');
  assert.equal(await page.locator('.tool-group').count(), 0, 'No empty category sections');
  assert.equal(await page.locator('.empty').count(), 1);
  await page.locator('#search').fill('');
  await page.locator('[data-category="合成化学"]').click();
  assert.equal(await page.locator('.tool-card').count(), 5);
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['合成化学']);
  assert.equal(await page.locator('.group-count').textContent(), '5 个资源');
  await page.locator('[data-category="学术期刊"]').click();
  assert.equal(await page.locator('#searchPanel').isVisible(), true, 'Changing category keeps the search panel open');
  assert.equal(await page.locator('.tool-card').count(), journals.length);
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['学术期刊']);
  assert.equal(await page.locator('.group-count').textContent(), `${journals.length} 个资源`);
  assert.equal(await page.locator('[data-category="学术期刊"] .filter-count').textContent(), String(journals.length));
  await assertResourceLinks(page, '.tool-card', journals);
  await assertJournalSearch(page, '.tool-card', '.tool-name');
  await assertReferenceResolverSearch(page, '.tool-card', []);
  await assertPublisherSearch(page, '.tool-card');
  await assertPublisherCards(page, '.tool-card');
  await page.locator('#resultText').click();
  assert.equal(await page.locator('#searchPanel').isVisible(), false, 'Outside click still dismisses the panel');
  for (const shortcut of ['Control+k', 'Meta+k']) {
    await page.keyboard.press(shortcut);
    // openPanel schedules focus on the next animation frame, not in the keydown handler.
    await page.waitForFunction(() => document.activeElement === document.querySelector('#search'));
    assert.equal(await page.locator('#search').evaluate(el => el === document.activeElement), true, `${shortcut}: focus homepage search`);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#searchPanel').isVisible(), false, 'Escape closes the homepage panel');
  }
  await page.locator('#searchToggle').click();
  await page.locator('#search').fill('专利');
  assert.equal(await page.locator('.tool-card').count(), 0, 'Journal category does not leak patent search results');
  await page.locator('#search').fill('');
  await page.locator('[data-category="试剂采购"]').click();
  assert.equal(await page.locator('.tool-card').count(), suppliers.length);
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['试剂采购']);
  assert.equal(await page.locator('.group-count').textContent(), `${suppliers.length} 个资源`);
  assert.equal(await page.locator('[data-category="试剂采购"] .filter-count').textContent(), String(suppliers.length));
  await assertResourceLinks(page, '.tool-card', suppliers);
  await assertSupplierSearch(page, '.tool-card', '.tool-name');
  await page.locator('#search').fill('ACS');
  assert.equal(await page.locator('.tool-card').count(), 0, 'Supplier category does not leak journal results');
  assert.equal(await page.locator('.tool-group').count(), 0, 'No empty supplier group');
  await page.locator('#search').fill('');
  await page.locator('[data-category="文献专利搜索"]').click();
  assert.equal(await page.locator('.tool-card').count(), literature.length);
  assert.equal(await page.locator('.group-count').textContent(), `${literature.length} 个资源`);
  assert.equal(await page.locator('[data-category="文献专利搜索"] .filter-count').textContent(), String(literature.length));
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['文献专利搜索']);
  await assertResourceLinks(page, '.tool-card', literature);
  await assertSciHubSearch(page, '.tool-card');
  await assertReferenceResolverSearch(page, '.tool-card');
  await assertPublisherSearch(page, '.tool-card', false);
  await page.locator('[data-category="全部工具"]').click();
  await assertSciHubSearch(page, '.tool-card');
  await assertReferenceResolverSearch(page, '.tool-card');
  await assertPublisherSearch(page, '.tool-card');
  for (const query of ['文献专利搜索', '文献专利']) {
    await page.locator('#search').fill(query);
    await assertResourceLinks(page, '.tool-card', literature);
    assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['文献专利搜索']);
  }
  await page.locator('#search').fill('DOI');
  await assertResourceLinks(page, '.tool-card', [referenceResolver, sciHub]);
  await page.locator('#search').fill('');
  await assertMolAidSearch(page, '.tool-card');
  await page.locator('[data-category="化合物数据库"]').click();
  assert.equal(await page.locator('.tool-card').count(), 6);
  assert.equal(await page.locator('.group-count').textContent(), '6 个资源');
  assert.equal(await page.locator('[data-category="化合物数据库"] .filter-count').textContent(), '6');
  await assertMolAidSearch(page, '.tool-card');
  await page.locator('[data-category="全部工具"]').click();
  await page.locator('#search').fill('Chem Station');
  await assertResourceLinks(page, '.tool-card', [communities[1]]);
  await page.locator('#search').fill('');
  await page.locator('[data-category="社区与资讯"]').click();
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['社区与资讯']);
  assert.equal(await page.locator('.group-count').textContent(), `${communities.length} 个资源`);
  assert.equal(await page.locator('[data-category="社区与资讯"] .filter-count').textContent(), String(communities.length));
  await assertResourceLinks(page, '.tool-card', communities);
  await assertCommunitySearch(page, '.tool-card');
  await page.locator('[data-category="化学研究课题组主页"]').click();
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['化学研究课题组主页']);
  assert.equal(await page.locator('.group-count').textContent(), `${researchGroups.length} 个资源`);
  assert.equal(await page.locator('[data-category="化学研究课题组主页"] .filter-count').textContent(), String(researchGroups.length));
  await assertResourceLinks(page, '.tool-card', researchGroups);
  await assertGroupSearch(page, '.tool-card', '.tool-name');
  await page.locator('[data-category="学习资源"]').click();
  await assertProblemSearch(page, '.tool-card', '.tool-name');
  await page.locator('#search').fill('福山');
  await assertResourceLinks(page, '.tool-card', [mechanismProblems]);
  await page.locator('[data-category="全部工具"]').click();
  assert.deepEqual(await page.locator('.tool-name').allTextContents(), ['横岛聪 Yokoshima', mechanismProblems[1]]);
  assert.deepEqual(await page.locator('.group-heading h2').allTextContents(), ['化学研究课题组主页', '学习资源']);
  await page.locator('#closePanel').click();
  await assertIcons(page, '.tool-logo img', 2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#browse').click();
  assert.equal(await page.locator('.tool-card').count(), totalTools);
  assert.equal(await page.locator('.tool-group').count(), expectedGroups.length, 'Browse restores all category groups');
  await assertIcons(page, '.tool-logo img', totalIcons);
  await page.waitForTimeout(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#filterToggle').click();
  await page.locator('[data-category="学术期刊"]').click();
  await page.locator('#closePanel').click();
  await assertIcons(page, '.tool-logo img', journalIcons);
  await assertPublisherCards(page, '.tool-card');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#filterToggle').click();
  await page.locator('[data-category="试剂采购"]').click();
  await page.locator('#closePanel').click();
  await assertIcons(page, '.tool-logo img', suppliers.length);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#filterToggle').click();
  await page.locator('[data-category="化学研究课题组主页"]').click();
  await page.locator('#closePanel').click();
  await assertIcons(page, '.tool-logo img', researchGroups.length);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#filterToggle').click();
  await page.locator('[data-category="社区与资讯"]').click();
  await page.locator('#closePanel').click();
  await assertIcons(page, '.tool-logo img', communities.length);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#filterToggle').click();
  await page.locator('[data-category="化合物数据库"]').click();
  await page.locator('#closePanel').click();
  await assertIcons(page, '.tool-logo img', 6);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('PASS MolAid: exact /home URL, stable index 71, local favicon, bilingual search, database filtering and fallback');
  await page.locator('#filterToggle').click();
  await page.locator('[data-category="文献专利搜索"]').click();
  await page.locator('#closePanel').click();
  await assertResourceLinks(page, '.tool-card', literature);
  await assertIcons(page, '.tool-logo img', literature.length);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('PASS Chemistry Reference Resolver: exact homepage URL, stable index 72, local favicon, citation/DOI search, literature search category and fallback');
  console.log('PASS community/resources: stable links, bilingual aliases, category filtering and icon fallback');
  console.log(`PASS grouped dark homepage: ${expectedGroups.length} categories / ${totalTools} unique cards, journal/supplier/group URLs and searches, Fukuyama archive classification, filtered counts, responsive grids in both views across 10 widths, compact icons and content bounds`);
  // Local double-click remains a supported way to open the homepage.
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await assertIcons(page, '.tool-logo img', totalIcons);
  assert.equal(await page.locator('.tool-group').count(), categoryNames.length, 'All categories render from local files');
  await page.locator('#filterToggle').click();
  await assertMolAidSearch(page, '.tool-card');
  await page.locator('[data-category="化合物数据库"]').click();
  await assertMolAidSearch(page, '.tool-card');
  await page.locator('[data-category="学术期刊"]').click();
  await assertResourceLinks(page, '.tool-card', journals);
  await assertJournalSearch(page, '.tool-card', '.tool-name');
  await assertReferenceResolverSearch(page, '.tool-card', []);
  await assertPublisherSearch(page, '.tool-card');
  await assertPublisherCards(page, '.tool-card');
  await page.locator('[data-category="文献专利搜索"]').click();
  await assertResourceLinks(page, '.tool-card', literature);
  await assertSciHubSearch(page, '.tool-card');
  await assertReferenceResolverSearch(page, '.tool-card');
  await page.locator('[data-category="社区与资讯"]').click();
  await assertResourceLinks(page, '.tool-card', communities);
  await assertCommunitySearch(page, '.tool-card');
  await page.locator('[data-category="试剂采购"]').click();
  assert.equal(await page.locator('.tool-card').count(), suppliers.length);
  await assertResourceLinks(page, '.tool-card', suppliers);
  await assertSupplierSearch(page, '.tool-card', '.tool-name');
  await page.locator('[data-category="化学研究课题组主页"]').click();
  await assertResourceLinks(page, '.tool-card', researchGroups);
  await assertGroupSearch(page, '.tool-card', '.tool-name');
  await page.locator('[data-category="学习资源"]').click();
  await assertProblemSearch(page, '.tool-card', '.tool-name');
  await page.locator('#search').fill('福山');
  await assertResourceLinks(page, '.tool-card', [mechanismProblems]);
  console.log(`PASS all ${totalIcons} local icons: PNG format, source mappings and checksums, HTTP and file-protocol decoding, original 16px display size; ${totalTools - totalIcons} explicit text-only resources`);
  await assertCategoryCollapse(browser, base, root, catalog, categoryNames);
  await assertAdLayout(browser, base, root, totalTools);
  await assertPinnedTools(browser, base, root, catalog, categoryNames);
  assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
  const allowedAdSenseHosts = new Set(['pagead2.googlesyndication.com', 'googleads.g.doubleclick.net', 'ep1.adtrafficquality.google', 'ep2.adtrafficquality.google']);
  const unexpectedExternalRequests = externalRequests.filter(url => !allowedAdSenseHosts.has(new URL(url).hostname));
  assert.equal(externalRequests.some(url => new URL(url).hostname === 'pagead2.googlesyndication.com'), true, 'AdSense verification script is requested');
  assert.deepEqual(unexpectedExternalRequests, [], 'No unexpected external runtime requests');
  assert.deepEqual(pendingIconRequests, [], 'Text-only resources never request missing PNGs');
  console.log('PASS publishers: MDPI/Thieme/Taylor & Francis, stable indexes 73–75, bilingual aliases, journal filtering excludes resolver, text-only identities, no missing-icon requests and HTTP/local files');
  console.log('PASS formal homepage: local files, missing icons, restricted storage and no JS errors');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
});
