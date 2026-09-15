const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

module.exports = async function assertAdLayout(browser, base, root, totalTools) {
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
    assert.equal(await page.locator('.ad-rail').count(), 2);
    assert.equal(await page.locator('#ad-slot-left').count(), 1);
    assert.equal(await page.locator('#ad-slot-right').count(), 1);
    assert.deepEqual(await page.locator('.ad-label').allTextContents(), ['广告', '广告']);
    assert.equal(await page.locator('.ad-slot a, .ad-slot button, .ad-slot iframe, .ad-slot ins.adsbygoogle').count(), 0, 'Reservations are not live or clickable ads');
    assert.equal(await page.locator('.tool-card').count(), totalTools);
    assert.equal(await page.locator('.tool-card:visible').count(), 0, 'Default category folding is unchanged');
    await page.locator('.group-toggle').first().click();
    assert.ok(await page.locator('.tool-card:visible').count() > 0, 'Categories still expand between the rails');

    for (const view of ['grid', 'list']) {
      if (view === 'list') await page.locator('#viewToggle').click();
      for (const width of [320, 390, 580, 768, 900, 901, 1100, 1280, 1366, 1439, 1440, 1600, 1920, 2560]) {
        await page.setViewportSize({ width, height: 1000 });
        const geometry = await page.evaluate(() => {
          const main = document.querySelector('main').getBoundingClientRect().toJSON();
          const rails = [...document.querySelectorAll('.ad-rail')].map(rail => ({
            display: getComputedStyle(rail).display,
            position: getComputedStyle(rail).position,
            slot: rail.querySelector('.ad-slot').getBoundingClientRect().toJSON()
          }));
          return { main, rails, viewport: document.documentElement.clientWidth, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.equal(geometry.overflow, false, `${view}/${width}: no horizontal overflow`);
        const wide = width >= 1440;
        assert.equal(geometry.rails.every(rail => rail.display === (wide ? 'block' : 'none')), true, `${view}/${width}: desktop-only rails`);
        const expectedWidth = wide
          ? Math.min(1216, geometry.viewport - 416)
          : Math.min(geometry.viewport, width <= 900 ? 820 : 1264) - (width <= 580 ? 32 : 48);
        assert.ok(Math.abs(geometry.main.width - expectedWidth) < 1, `${view}/${width}: expected content width ${expectedWidth}, got ${geometry.main.width}`);
        if (wide) {
          const [left, right] = geometry.rails;
          for (const rail of geometry.rails) {
            assert.equal(rail.slot.width, 160, 'The full 160px slot width is reserved');
            assert.equal(rail.slot.height, 600, 'The full 600px slot height is reserved');
            assert.equal(rail.position, 'static', 'Rails do not overlay content as floating or sticky ads');
            assert.ok(rail.slot.left >= 0 && rail.slot.right <= geometry.viewport);
          }
          assert.ok(Math.abs(geometry.main.left - left.slot.right - 24) < 1, 'Left slot is separated from navigation cards');
          assert.ok(Math.abs(right.slot.left - geometry.main.right - 24) < 1, 'Right slot is separated from navigation cards');
        }
        assert.ok(await page.locator('.tool-card:visible').evaluateAll(cards => cards.every(card => {
          const bounds = card.getBoundingClientRect();
          const main = document.querySelector('main').getBoundingClientRect();
          return bounds.left >= main.left && bounds.right <= main.right + 1;
        })), 'Cards stay inside the center column');
      }
    }
    await page.locator('#viewToggle').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.setViewportSize({ width: 390, height: 844 });

    await page.setViewportSize({ width: 1920, height: 1000 });
    const beforeFill = await page.locator('main').boundingBox();
    await page.locator('.ad-slot').evaluateAll(slots => slots.forEach(slot => {
      const mock = document.createElement('div');
      mock.style.width = '160px';
      mock.style.height = '600px';
      slot.replaceChildren(mock);
    }));
    assert.deepEqual(await page.locator('main').boundingBox(), beforeFill, 'Filling a reserved slot does not move the main content');
    await page.locator('#searchToggle').click();
    await page.locator('#search').fill('Chem Station');
    assert.equal(await page.locator('.tool-card:visible').count(), 1, 'Search remains usable with side rails');
    await page.locator('#search').fill('not-a-real-tool');
    assert.equal(await page.locator('.empty').count(), 1);
    assert.equal(await page.locator('.tool-group').count(), 0);

    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    assert.equal(await page.locator('.ad-rail:visible').count(), 2, 'Local-file desktop layout includes both slots');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.ad-rail:visible').count(), 0, 'Local-file mobile layout hides both slots');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const remoteRequests = requests.filter(url => /^https?:/.test(url) && new URL(url).origin !== new URL(base).origin);
    const allowedAdSenseHosts = new Set(['pagead2.googlesyndication.com', 'googleads.g.doubleclick.net', 'ep1.adtrafficquality.google', 'ep2.adtrafficquality.google']);
    const allowedAdSense = remoteRequests.filter(url => allowedAdSenseHosts.has(new URL(url).hostname));
    assert.equal(allowedAdSense.some(url => new URL(url).hostname === 'pagead2.googlesyndication.com'), true, 'AdSense verification script is requested');
    assert.deepEqual(remoteRequests.filter(url => !allowedAdSenseHosts.has(new URL(url).hostname)), [], 'No unexpected third-party requests are made');
    assert.deepEqual(errors, [], 'No JavaScript errors from the reserved ad layout');
    console.log('PASS ad reservations: two static 160x600 slots, >=1440px only, 24px gaps, both views across 14 widths, stable center layout, search, local files, AdSense verification script allowed');
  } finally {
    await context.close();
  }
};
