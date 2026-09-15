const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

module.exports = async function assertCategoryCollapse(browser, base, root, catalog, categoryNames) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', hasTouch: true
  });
  const storageKey = 'chemhub.collapsed-categories.v1';
  const firstName = categoryNames[0], secondName = categoryNames[1];
  const firstTools = catalog.filter(tool => tool.c === firstName);
  const errors = [];
  try {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/index.html`);
    const first = page.locator(`[data-group-toggle="${firstName}"]`);
    const second = page.locator(`[data-group-toggle="${secondName}"]`);
    const contentId = await first.getAttribute('aria-controls');
    const content = page.locator(`#${contentId}`);
    assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), categoryNames.length, 'Categories start collapsed without saved preferences');
    assert.equal(await page.locator('.tool-card:visible').count(), 0, 'No resource cards are shown by default');
    const references = await page.locator('.group-toggle').evaluateAll(buttons => buttons.map(button => {
      const body = document.getElementById(button.getAttribute('aria-controls'));
      const count = document.getElementById(button.getAttribute('aria-describedby'));
      return button.tagName === 'BUTTON' && button.closest('h2') && body?.classList.contains('group-grid') && count?.classList.contains('group-count') && body.hidden;
    }));
    assert.ok(references.every(Boolean), 'Native disclosure buttons have valid headings, panels and count descriptions');

    await first.click();
    assert.equal(await content.isVisible(), true, 'A default-collapsed category can be expanded');
    await page.reload();
    assert.equal(await first.getAttribute('aria-expanded'), 'true', 'Saved expansion overrides the collapsed default after reload');
    assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), categoryNames.length - 1);
    // Continue testing independent folding from an explicitly expanded browse view.
    while (await page.locator('.group-toggle[aria-expanded="false"]').count()) {
      await page.locator('.group-toggle[aria-expanded="false"]').first().click();
    }
    await first.click();
    assert.equal(await first.getAttribute('aria-expanded'), 'false');
    assert.equal(await content.isVisible(), false);
    assert.equal(await page.locator('.tool-card:visible').count(), catalog.length - firstTools.length, 'Only this category is hidden');
    assert.equal(await page.locator('.tool-card').count(), catalog.length, 'Collapsing preserves all resource nodes');
    assert.equal(await first.locator('xpath=ancestor::section').locator('.group-count').textContent(), `${firstTools.length} 个资源`);
    assert.equal(await first.evaluate(button => button === document.activeElement), true, 'Toggling does not replace the focused button');
    await first.press('Enter');
    assert.equal(await first.getAttribute('aria-expanded'), 'true', 'Enter expands');
    await first.press('Space');
    assert.equal(await first.getAttribute('aria-expanded'), 'false', 'Space collapses');
    await page.keyboard.press('Tab');
    assert.equal(await second.evaluate(button => button === document.activeElement), true, 'Tab skips hidden resource links');
    await page.reload();
    assert.equal(await first.getAttribute('aria-expanded'), 'false', 'Browse preference survives reload');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), [firstName]);
    await page.locator('#viewToggle').click();
    assert.equal(await page.locator('#toolGrid').evaluate(grid => grid.classList.contains('list')), true);
    assert.equal(await content.isVisible(), false, 'List view keeps collapse state');
    await page.locator('#viewToggle').click();
    assert.equal(await content.isVisible(), false, 'Grid view keeps collapse state');

    await page.locator('#searchToggle').click();
    await page.locator('#search').fill(firstTools[0].n);
    assert.equal(await first.getAttribute('aria-expanded'), 'true', 'Matching search results expand automatically');
    assert.equal(await page.locator('.tool-card:visible').count(), 1);
    await first.click();
    assert.equal(await content.isVisible(), false, 'Search results can still be manually collapsed');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), [firstName], 'Temporary search toggles do not overwrite browse preference');
    await page.locator('#searchToggle').click();
    await page.locator('#search').fill(firstTools[1].n);
    assert.equal(await content.isVisible(), true, 'A new query reveals its results again');
    await page.locator('#search').fill('not-a-real-tool');
    assert.equal(await page.locator('.tool-group').count(), 0);
    assert.equal(await page.locator('.empty').count(), 1);
    await page.locator('#search').fill('');
    assert.equal(await content.isVisible(), false, 'Clearing search restores the collapsed category');
    await page.locator(`[data-category="${firstName}"]`).click();
    assert.equal(await content.isVisible(), true, 'Explicit category filtering reveals a saved collapsed category');
    assert.equal(await page.locator('.tool-card:visible').count(), firstTools.length);
    await page.locator(`[data-category="${secondName}"]`).click();
    await second.click();
    assert.equal(await second.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), [firstName], 'Temporary category toggles do not add saved collapsed groups');
    await page.locator('#reset').click();
    assert.equal(await first.getAttribute('aria-expanded'), 'false');
    assert.equal(await second.getAttribute('aria-expanded'), 'true', 'Reset restores the normal browse state');
    await page.locator('#searchToggle').click();
    await page.locator('#search').fill(firstTools[0].n);
    await page.locator('#browse').click();
    assert.equal(await first.getAttribute('aria-expanded'), 'false', 'Browse preserves saved folding preferences');

    for (const name of categoryNames) {
      const button = page.locator(`[data-group-toggle="${name}"]`);
      if (await button.getAttribute('aria-expanded') === 'true') await button.click();
    }
    assert.equal(await page.locator('.tool-card:visible').count(), 0);
    assert.equal(await page.locator('.empty').count(), 0, 'All collapsed is not a no-results state');
    assert.equal(await page.locator('.group-count').evaluateAll(counts => counts.reduce((total, count) => total + parseInt(count.textContent, 10), 0)), catalog.length);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Collapsed groups fit ${width}px`);
      assert.equal(await page.locator('.group-toggle').evaluateAll(buttons => buttons.every(button => {
        const rect = button.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth && rect.height >= (innerWidth <= 580 ? 44 : 36);
      })), true, 'Disclosure hit targets remain usable');
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.setViewportSize({ width: 390, height: 844 });
    await first.tap();
    assert.equal(await page.locator('.tool-card:visible').count(), firstTools.length, 'Touch expands a category on mobile');
    await first.tap();
    assert.equal(await content.isVisible(), false, 'Touch collapses it again');

    for (const invalid of ['not-json', '{"结构绘制":true}']) {
      await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: storageKey, value: invalid });
      await page.reload();
      assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), categoryNames.length, 'Malformed stored state falls back to all collapsed');
    }
    await page.evaluate(({ key, name }) => localStorage.setItem(key, JSON.stringify([null, 42, {}, name, name, '不存在的分类', '全部工具'])), { key: storageKey, name: firstName });
    await page.reload();
    assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), 1, 'Only known category names are restored');
    await first.click();
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), [], 'Next save drops invalid and duplicate stored names');
    await page.reload();
    assert.equal(await page.locator('.group-toggle[aria-expanded="true"]').count(), categoryNames.length, 'An explicit empty array preserves all-expanded preference');
    await page.evaluate(key => localStorage.removeItem(key), storageKey);
    await page.reload();
    assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), categoryNames.length, 'Removing the preference restores collapsed defaults');

    const oldName = '文献专利', newName = '文献专利搜索';
    const pinKey = 'chemhub.pinned-tools.v1', savedPins = JSON.stringify([catalog[72].u]);
    for (const [stored, expected] of [
      [[oldName], [newName]],
      [[oldName, newName, firstName, null, '不存在的分类'], [firstName, newName]],
      [[newName], [newName]],
      [categoryNames.map(name => name === newName ? oldName : name), categoryNames],
      [[], []]
    ]) {
      const value = JSON.stringify(stored);
      await page.evaluate(({ key, value, pinKey, savedPins }) => {
        localStorage.setItem(key, value);
        localStorage.setItem(pinKey, savedPins);
      }, { key: storageKey, value, pinKey, savedPins });
      await page.reload();
      assert.equal(await page.locator(`[data-group-toggle="${oldName}"]`).count(), 0, 'The legacy category is not rendered');
      assert.deepEqual(await page.locator('.group-toggle[aria-expanded="false"]').evaluateAll(buttons => buttons.map(button => button.dataset.groupToggle)), expected, 'Rename preserves saved folding, deduplicates aliases, and respects all-expanded state');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), value, 'Restoring legacy preferences does not write storage');
      assert.equal(await page.locator('#pinnedGrid .pinned-link').getAttribute('href'), catalog[72].u, 'An existing resolver pin survives its category move');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), pinKey), savedPins, 'Category migration does not rewrite personal pins');
    }
    const renamed = page.locator(`[data-group-toggle="${newName}"]`);
    await page.evaluate(({ key, name }) => localStorage.setItem(key, JSON.stringify([name])), { key: storageKey, name: oldName });
    await page.reload();
    await first.click();
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), [newName, firstName], 'The next manual save replaces the legacy name and preserves both preferences');
    await page.reload();
    assert.equal(await renamed.getAttribute('aria-expanded'), 'false', 'The renamed category preference persists');
    await page.evaluate(keys => keys.forEach(key => localStorage.removeItem(key)), [storageKey, pinKey]);

    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), categoryNames.length, 'Local files default to collapsed too');
    await first.click();
    assert.equal(await content.isVisible(), true);
    await first.click();
    assert.equal(await content.isVisible(), false, 'Collapsing works when opened as a local file');
    await page.locator('#searchToggle').click();
    await page.locator('#search').fill(firstTools[0].n);
    assert.equal(await content.isVisible(), true, 'Local-file search reveals collapsed results');
    await page.locator('#search').fill('');
    assert.equal(await content.isVisible(), false);

    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
    });
    await page.goto(`${base}/index.html`);
    assert.equal(await page.locator('.group-toggle[aria-expanded="false"]').count(), categoryNames.length, 'Denied storage defaults to collapsed');
    await first.click();
    assert.equal(await content.isVisible(), true, 'Denied storage still allows in-memory expansion');
    await first.click();
    assert.equal(await content.isVisible(), false, 'Denied storage still allows in-memory folding');
    await page.locator('#searchToggle').click();
    await page.locator('#search').fill(firstTools[0].n);
    assert.equal(await content.isVisible(), true);
    await page.locator('#search').fill('');
    assert.equal(await content.isVisible(), false, 'Denied storage keeps in-memory preferences across filtering');
    assert.deepEqual(errors, [], 'No JavaScript errors from folding or restricted storage');
    console.log('PASS category folding: mouse/keyboard/touch, hidden tab stops, independent state, reload, both views, search/filter restoration, responsive controls, local files, invalid/denied storage, legacy category migration and unchanged personal pins');
  } finally {
    await context.close();
  }
};
