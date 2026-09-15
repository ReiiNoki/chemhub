const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

module.exports = async function assertSideSpacing(browser, base, root, totalTools) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [], requests = [];
  try {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    await page.route('**/*', route => {
      const url = route.request().url();
      if (/^https?:/.test(url) && new URL(url).origin !== new URL(base).origin) return route.abort();
      return route.continue();
    });
    await page.goto(`${base}/index.html`);
    assert.equal(await page.locator('.ad-rail, .ad-slot, .ad-placeholder, .ad-label').count(), 0, 'No visible ad reservation boxes remain');
    assert.equal(await page.locator('text=广告位预留').count(), 0, 'No ad placeholder copy remains');
    assert.equal(await page.locator('.tool-card').count(), totalTools);
    assert.equal(await page.locator('.tool-card:visible').count(), 0, 'Default category folding is unchanged');
    await page.locator('.group-toggle').first().click();
    assert.ok(await page.locator('.tool-card:visible').count() > 0, 'Categories still expand inside the centered content');

    for (const view of ['grid', 'list']) {
      if (view === 'list') await page.locator('#viewToggle').click();
      for (const width of [320, 390, 580, 768, 900, 901, 1100, 1280, 1366, 1439, 1440, 1600, 1920, 2560]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
        const metrics = await page.evaluate(() => {
          const layout = document.querySelector('.page-layout').getBoundingClientRect();
          const main = document.querySelector('main').getBoundingClientRect();
          const grid = document.querySelector('#toolGrid').getBoundingClientRect();
          const cardElement = [...document.querySelectorAll('.tool-card')].find(card => card.offsetParent !== null);
          const card = cardElement.getBoundingClientRect();
          const styles = getComputedStyle(document.querySelector('.page-layout'));
          return {
            layout, main, grid, card,
            columns: getComputedStyle(document.querySelector('#toolGrid')).gridTemplateColumns.split(' ').filter(Boolean).length,
            paddingLeft: parseFloat(styles.paddingLeft),
            paddingRight: parseFloat(styles.paddingRight),
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: innerWidth
          };
        });
        assert.ok(metrics.layout.left >= -0.5 && metrics.layout.right <= width + 0.5, `${width}px: layout stays inside viewport`);
        assert.ok(metrics.main.width > 0 && metrics.main.width <= 1216 + 1, `${width}px: content width is bounded`);
        assert.equal(metrics.scrollWidth <= metrics.innerWidth + 1, true, `${width}px: no horizontal overflow`);
        if (width >= 1440) {
          assert.ok(metrics.paddingLeft >= 208 - 0.5, `${width}px: left wide-screen space is reserved`);
          assert.ok(metrics.paddingRight >= 208 - 0.5, `${width}px: right wide-screen space is reserved`);
          assert.ok(metrics.main.left - metrics.layout.left >= 208 - 0.5, `${width}px: main starts after left space`);
          assert.ok(metrics.layout.right - metrics.main.right >= 208 - 0.5, `${width}px: main ends before right space`);
        } else {
          assert.ok(metrics.paddingLeft <= 24 + 0.5, `${width}px: no large side reservation on smaller screens`);
          assert.ok(metrics.paddingRight <= 24 + 0.5, `${width}px: no large side reservation on smaller screens`);
        }
        if (view === 'grid') {
          assert.equal(metrics.columns, width <= 580 ? 1 : width <= 900 ? 2 : 3, `${width}px grid columns`);
        } else {
          assert.equal(metrics.columns, 1, `${width}px list columns`);
        }
        assert.ok(metrics.card.width <= metrics.grid.width + 1, `${width}px: cards stay within content`);
      }
    }

    await page.locator('#searchToggle').click();
    await page.locator('#search').fill('zzzz-no-result');
    assert.equal(await page.locator('.empty').isVisible(), true, 'No-result search still appears in centered content');
    assert.equal(await page.locator('.tool-group').count(), 0);

    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    assert.equal(await page.locator('.ad-rail, .ad-slot, .ad-placeholder, .ad-label').count(), 0, 'Local-file view has no ad boxes');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const remoteRequests = requests.filter(url => /^https?:/.test(url) && new URL(url).origin !== new URL(base).origin);
    const allowedAdSenseHosts = new Set(['pagead2.googlesyndication.com', 'googleads.g.doubleclick.net', 'ep1.adtrafficquality.google', 'ep2.adtrafficquality.google']);
    const allowedAdSense = remoteRequests.filter(url => allowedAdSenseHosts.has(new URL(url).hostname));
    assert.equal(allowedAdSense.some(url => new URL(url).hostname === 'pagead2.googlesyndication.com'), true, 'AdSense verification script is requested');
    assert.deepEqual(remoteRequests.filter(url => !allowedAdSenseHosts.has(new URL(url).hostname)), [], 'No unexpected third-party requests are made');
    assert.deepEqual(errors, [], 'No JavaScript errors from the side spacing layout');
    console.log('PASS side spacing: no ad boxes, wide-screen left/right space, stable center layout, search, local files, AdSense verification script allowed');
  } finally {
    await context.close();
  }
};
