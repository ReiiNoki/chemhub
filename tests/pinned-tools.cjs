const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

module.exports = async function assertPinnedTools(browser, base, root, catalog, categoryNames) {
  const key = 'chemhub.pinned-tools.v1';
  const collapseKey = 'chemhub.collapsed-categories.v1';
  const savedKey = 'chemhub.unrelated-storage-test.v1';
  const errors = [], remoteRequests = [], popups = [];
  const options = { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', hasTouch: true };
  const context = await browser.newContext(options);
  function localOnly(route) {
    const url = route.request().url();
    if (/^https?:/.test(url) && new URL(url).origin !== new URL(base).origin) {
      const host = new URL(url).hostname;
      if (host === 'pagead2.googlesyndication.com') return route.abort();
      remoteRequests.push(url);
      return route.abort();
    }
    return route.continue();
  }
  await context.route('**/*', localOnly);
  try {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('popup', popup => popups.push(popup));
    function pin(index, target = page) {
      return target.locator(`#toolGrid .tool-item[data-tool="${index}"] > button[data-pin-toggle]`);
    }
    function unpin(index, target = page) {
      return target.locator(`#pinnedGrid .pinned-item[data-tool="${index}"] > button[data-unpin]`);
    }
    async function find(index, target = page) {
      if (!await target.locator('#searchPanel').isVisible()) await target.locator('#searchToggle').click();
      await target.locator('#search').fill(catalog[index].n);
      await pin(index, target).waitFor({ state: 'visible' });
    }
    async function order(indexes, target = page) {
      assert.deepEqual(await target.locator('#pinnedGrid .pinned-item').evaluateAll(items => items.map(item => Number(item.dataset.tool))), indexes);
      assert.equal(await target.locator('#pinnedCount').textContent(), `${indexes.length} 个`);
      const links = await target.locator('#pinnedGrid .pinned-link').evaluateAll(items => items.map(link => ({
        name: link.querySelector('.pinned-name').textContent,
        href: link.getAttribute('href'), target: link.target, rel: link.rel,
        icon: link.querySelector('img')?.getAttribute('src') ?? null
      })));
      assert.deepEqual(links, indexes.map(index => ({
        name: catalog[index].n, href: catalog[index].u, target: '_blank', rel: 'noopener noreferrer',
        icon: catalog[index].icon === false ? null : `assets/icons/${index}.png`
      })), 'Pinned shortcuts retain real resource identities and explicit text-only modes');
    }
    async function stored(indexes, target = page) {
      assert.deepEqual(await target.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key), indexes.map(index => catalog[index].u));
    }

    await page.goto(`${base}/index.html`);
    assert.equal(await page.locator('#pinnedTools').isVisible(), true);
    assert.equal(await page.locator('#pinnedEmpty').isVisible(), true);
    await order([]);
    assert.equal(await page.locator('.tool-card:visible').count(), 0, 'No personal pins are preselected and categories stay collapsed');
    assert.equal(await page.locator('#main a button, #main button a').count(), 0, 'Links and pin controls are siblings, never nested interactive elements');
    assert.equal(await page.evaluate(storageKey => localStorage.getItem(storageKey), key), null);
    await page.evaluate(({ storageKey, url }) => localStorage.setItem(storageKey, JSON.stringify([url])), { storageKey: savedKey, url: catalog[31].u });

    await page.locator('#choosePinned').click();
    await page.waitForFunction(() => document.activeElement === document.querySelector('#search'));
    assert.equal(await page.locator('#searchPanel').isVisible(), true, 'Choose tools does not immediately dismiss its search panel');
    await find(0);
    assert.equal(await page.locator('#pinnedTools').isVisible(), false, 'Filtering hides unrelated pinned shortcuts');
    assert.ok(await pin(0).evaluate(button => button.getBoundingClientRect().top >= document.querySelector('#searchPanel').getBoundingClientRect().bottom), 'Open search leaves result pin controls unobstructed');
    const originalButton = await pin(0).elementHandle();
    const originalCount = await page.locator('.tool-card').count();
    await pin(0).click();
    assert.equal(await originalButton.evaluate(button => button.isConnected && button === document.activeElement), true, 'Pinning keeps the original control and focus');
    assert.equal(await pin(0).getAttribute('aria-pressed'), 'true');
    assert.equal(await pin(0).getAttribute('aria-label'), `置顶 ${catalog[0].n}`, 'Toggle label stays stable while aria-pressed conveys state');
    assert.equal(await pin(0).getAttribute('title'), '取消置顶');
    assert.equal(await page.locator('#searchPanel').isVisible(), true);
    assert.equal(await page.locator('.tool-card').count(), originalCount);
    await stored([0]);
    assert.equal(await page.evaluate(storageKey => localStorage.getItem(storageKey), collapseKey), null, 'Pinning does not save folding preferences');
    assert.deepEqual(await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), savedKey), [catalog[31].u], 'Preview bookmarks remain separate');

    await page.locator('#search').fill('化学');
    const temporaryGroup = page.locator('.tool-group:not(:has([data-group-toggle="学术期刊"])) .group-toggle').first();
    await temporaryGroup.click();
    const temporaryNode = await temporaryGroup.elementHandle();
    await page.locator('#searchToggle').click();
    await pin(73).click();
    assert.equal(await temporaryNode.evaluate(button => button.isConnected && button.getAttribute('aria-expanded') === 'false'), true, 'Pinning preserves temporary search folding without rebuilding categories');
    assert.equal(await page.locator('#search').inputValue(), '化学');
    assert.equal(await page.locator('#searchPanel').isVisible(), true);
    await stored([0, 73]);
    for (const index of [72, 75]) { await find(index); await pin(index).click(); }
    await stored([0, 73, 72, 75]);
    await page.locator('#browse').click();
    await order([0, 73, 72, 75]);
    assert.equal(await page.locator('#main').evaluate(main => main === document.activeElement), true);
    assert.ok(await page.locator('#pinnedTools').evaluate(section => section.getBoundingClientRect().bottom <= document.querySelector('#toolGrid').getBoundingClientRect().top), 'Personal shortcuts precede every category');
    assert.equal(await page.locator('.tool-card').count(), catalog.length, 'Shortcuts do not add resources or remove original category entries');
    assert.equal(await page.locator('.tool-group').count(), categoryNames.length);
    assert.equal(await page.locator('.tool-group:has([data-group-toggle="文献专利搜索"]) .tool-card').first().getAttribute('href'), catalog[72].u, 'Editorial literature search priority remains independent');
    assert.equal(await page.locator('#total').textContent(), `收录 ${catalog.length} 个精选资源`);
    await page.reload();
    await order([0, 73, 72, 75]);
    assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), categoryNames.length);
    assert.equal(await page.locator('.tool-card:visible').count(), 0);
    assert.equal(await page.locator('.pinned-link:visible').count(), 4, 'Saved shortcuts remain accessible above collapsed categories');

    await unpin(73).focus();
    await unpin(73).press('Space');
    await order([0, 72, 75]);
    assert.equal(await unpin(72).evaluate(button => button === document.activeElement), true, 'Removing a shortcut focuses its next neighbor');
    assert.equal(await pin(73).getAttribute('aria-pressed'), 'false');
    await find(0);
    await pin(0).focus();
    await pin(0).press('Enter');
    await stored([72, 75]);
    assert.equal(await pin(0).evaluate(button => button === document.activeElement), true);
    await pin(0).press('Space');
    await stored([72, 75, 0]);
    const originalLink = page.locator('#toolGrid .tool-item[data-tool="0"] .tool-card');
    await originalLink.focus();
    await page.keyboard.press('Tab');
    assert.equal(await pin(0).evaluate(button => button === document.activeElement), true, 'Keyboard order is resource link then its pin control');
    await originalLink.evaluate(link => {
      window.testResourceClicks = 0;
      link.addEventListener('click', event => { event.preventDefault(); window.testResourceClicks++; });
    });
    await pin(0).click();
    assert.equal(await page.evaluate(() => window.testResourceClicks), 0, 'Pinning never activates the resource link');
    await pin(0).click();
    await originalLink.click();
    assert.equal(await page.evaluate(() => window.testResourceClicks), 1, 'The original card is still a usable link (navigation prevented by the test)');
    await stored([72, 75, 0]);
    await find(73);
    await pin(73).click();
    await page.locator('#browse').click();
    await order([72, 75, 0, 73]);
    await page.locator('#searchToggle').click();
    await page.locator('#search').fill('not-a-real-tool');
    assert.equal(await page.locator('.pinned-link:visible').count(), 0);
    assert.equal(await page.locator('.tool-card').count(), 0);
    assert.equal(await page.locator('.empty').count(), 1);
    await page.locator('#reset').click();
    await order([72, 75, 0, 73]);
    assert.equal(await page.locator('#pinnedTools').isVisible(), true, 'Reset restores shortcuts without changing them');

    await page.locator('[data-group-toggle="学术期刊"]').click();
    await page.locator('#pinnedGrid img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    for (const view of ['grid', 'list']) {
      if (view === 'list') await page.locator('#viewToggle').click();
      for (const width of [320, 390, 580, 768, 900, 901, 1100, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        const expectedColumns = view === 'list' || width <= 580 ? 1 : width <= 900 ? 2 : 3;
        assert.equal(await page.locator('#pinnedGrid').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length), expectedColumns);
        const checks = await page.locator('.pinned-item:visible, .tool-item:visible').evaluateAll(items => items.map(item => {
          const rect = item.getBoundingClientRect();
          const button = item.querySelector('button[data-pin-toggle]').getBoundingClientRect();
          const title = item.querySelector('.pinned-text, .card-title').getBoundingClientRect();
          const logo = item.querySelector('.pinned-logo, .tool-logo').getBoundingClientRect();
          const image = item.querySelector('.pinned-logo img, .tool-logo img');
          const style = image && getComputedStyle(image);
          const overlapsTitle = button.left < title.right - .5 && button.right > title.left + .5 && button.top < title.bottom - .5 && button.bottom > title.top + .5;
          return {
            fits: rect.left >= 0 && rect.right <= innerWidth && button.left >= rect.left && button.right <= rect.right + .5 && button.top >= rect.top && button.bottom <= rect.bottom + .5,
            usable: button.width >= (innerWidth <= 580 ? 44 : 36) && button.height >= (innerWidth <= 580 ? 44 : 36),
            overlapsTitle, logo: [logo.width, logo.height],
            imageSize: style ? image.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) : null
          };
        }));
        assert.ok(checks.every(check => check.fits && check.usable && !check.overlapsTitle), `${view}/${width}: pin targets fit, are touch-sized and do not cover titles`);
        assert.ok(checks.every(check => check.logo[0] === 32 && check.logo[1] === 32 && (check.imageSize === null || check.imageSize === 16)), 'Pinned and original logos retain compact sizing');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
    }
    await page.locator('#viewToggle').click();
    await page.locator('[data-group-toggle="学术期刊"]').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#browse').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await unpin(75).tap();
    await order([72, 0, 73]);
    await find(75); await pin(75).tap();
    await page.locator('#browse').click();
    await order([72, 0, 73, 75]);
    await page.setViewportSize({ width: 1440, height: 1000 });

    const other = await context.newPage();
    other.on('pageerror', error => errors.push(error.message));
    await other.goto(`${base}/index.html`);
    await order([72, 0, 73, 75], other);
    await page.locator('#pinnedGrid .pinned-link').first().focus();
    await unpin(72, other).click();
    await page.waitForFunction(() => document.querySelector('#pinnedCount').textContent === '3 个');
    await order([0, 73, 75]);
    assert.equal(await page.locator('#pinnedGrid .pinned-link').first().evaluate(link => link === document.activeElement), true, 'Cross-tab updates preserve link focus when a focused shortcut disappears');
    const unchangedLink = await page.locator('#pinnedGrid .pinned-link').first().elementHandle();
    await other.evaluate(storageKey => localStorage.setItem(storageKey, '[]'), savedKey);
    await page.waitForTimeout(50);
    assert.equal(await unchangedLink.evaluate(link => link.isConnected && link === document.activeElement), true, 'Unrelated storage changes do not rebuild pins');
    await other.evaluate(storageKey => localStorage.removeItem(storageKey), key);
    await page.waitForFunction(() => document.querySelector('#pinnedCount').textContent === '0 个');
    assert.equal(await page.locator('#choosePinned').evaluate(button => button === document.activeElement), true);
    await other.evaluate(({ storageKey, url }) => localStorage.setItem(storageKey, JSON.stringify([url])), { storageKey: key, url: catalog[0].u });
    await page.waitForFunction(() => document.querySelector('#pinnedCount').textContent === '1 个');
    await other.evaluate(() => localStorage.clear());
    await page.waitForFunction(() => document.querySelector('#pinnedCount').textContent === '0 个');
    await other.close();

    for (const invalid of ['not-json', '{"0":true}', '42']) {
      await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, value), { storageKey: key, value: invalid });
      await page.reload();
      await order([]);
      assert.equal(await page.locator('#pinNotice').isVisible(), false, 'Malformed JSON does not incorrectly report storage denial');
    }
    await page.evaluate(({ storageKey, urls }) => localStorage.setItem(storageKey, JSON.stringify([null, 42, {}, 'javascript:alert(1)', 'https://unknown.invalid/', urls[0], urls[0], urls[1]])), { storageKey: key, urls: [catalog[73].u, catalog[0].u] });
    await page.reload();
    await order([73, 0]);
    await find(72); await pin(72).click();
    await stored([73, 0, 72]);
    await page.locator('#browse').click();
    while (await page.locator('#pinnedGrid button[data-unpin]').count()) await page.locator('#pinnedGrid button[data-unpin]').first().click();
    await stored([]);
    assert.equal(await page.locator('#choosePinned').evaluate(button => button === document.activeElement), true, 'Last removal returns focus to the chooser');
    await page.reload();
    await order([]);
    assert.equal(await page.locator('#pinnedEmpty').isVisible(), true);

    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await find(0); await pin(0).click();
    await page.locator('#browse').click();
    await order([0]);
    const canPersistFiles = !await page.locator('#pinNotice').isVisible();
    await page.reload();
    await order(canPersistFiles ? [0] : []);
    await page.goto(`${base}/index.html`);
    await page.evaluate(({ storageKey, url }) => localStorage.setItem(storageKey, JSON.stringify([url])), { storageKey: key, url: catalog[0].u });
    await page.route('**/assets/icons/0.png', route => route.abort());
    await page.reload();
    const brokenLogo = page.locator('#pinnedGrid .pinned-item[data-tool="0"] .pinned-logo');
    await brokenLogo.locator('img').waitFor({ state: 'detached' });
    assert.equal(await brokenLogo.innerText(), catalog[0].i, 'Unexpected icon failure also retains a readable pinned shortcut');
    await page.unroute('**/assets/icons/0.png');

    for (const mode of ['denied', 'quota']) {
      const restricted = await browser.newContext(options);
      try {
        await restricted.route('**/*', localOnly);
        await restricted.addInitScript(({ storageKey, existing, mode }) => {
          if (mode === 'denied') {
            Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
          } else {
            localStorage.setItem(storageKey, JSON.stringify([existing]));
            const setItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) {
              if (key === storageKey) throw new DOMException('Quota exceeded', 'QuotaExceededError');
              return setItem.call(this, key, value);
            };
          }
        }, { storageKey: key, existing: catalog[0].u, mode });
        const temporary = await restricted.newPage();
        temporary.on('pageerror', error => errors.push(error.message));
        await temporary.goto(`${base}/index.html`);
        await order(mode === 'quota' ? [0] : [], temporary);
        await find(73, temporary); await pin(73, temporary).click();
        assert.equal(await temporary.locator('#pinNotice').isVisible(), true, `${mode}: persistence failures are visible even during search`);
        assert.match(await temporary.locator('#announcement').textContent(), /仅本页有效/);
        await temporary.locator('#browse').click();
        await order(mode === 'quota' ? [0, 73] : [73], temporary);
        if (mode === 'quota') await stored([0], temporary);
        await temporary.reload();
        await order(mode === 'quota' ? [0] : [], temporary);
      } finally { await restricted.close(); }
    }
    assert.deepEqual(popups, [], 'Pin controls never open new windows');
    assert.deepEqual(remoteRequests, [], 'Pinning has no remote dependencies or navigation side effects');
    assert.deepEqual(errors, [], 'Personal pinning handles storage and image failures without uncaught errors');
    console.log('PASS personal pins: top shortcuts, stable identities/order, click/keyboard/touch, valid sibling controls, focus, folding/search isolation, reload/cross-tab/file persistence, invalid/denied/quota storage, compact icons, both views/responsive hit targets, no unexpected external requests');
  } finally { await context.close(); }
};
