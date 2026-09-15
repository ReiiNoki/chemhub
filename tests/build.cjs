const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const catalogSource = fs.readFileSync(path.join(root, 'tools.js'), 'utf8');
const catalog = JSON.parse(vm.runInNewContext(`${catalogSource}\nJSON.stringify(tools);`, {}, { timeout: 1000 }));
const iconFiles = catalog.flatMap((tool, index) => tool.icon === false ? [] : [`assets/icons/${index}.png`]);
const files = ['index.html', 'design.css', 'app.js', 'tools.js', ...iconFiles];
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'chemhub-build-test-'));
const output = path.join(fixture, 'dist');

function listFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), `${name}/`) : [name];
  }).sort();
}
function build() {
  // The script must resolve paths from its own location, not the caller's cwd.
  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts/build.cjs')], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 10000 });
  if (result.error) throw result.error;
  return result;
}
function assertOutput(expectedFiles = files, expectedCatalog = catalogSource) {
  assert.deepEqual(listFiles(output), [...expectedFiles].sort(), 'Only runtime files are published');
  for (const file of expectedFiles) {
    const expected = file === 'tools.js' ? Buffer.from(expectedCatalog) : fs.readFileSync(path.join(root, file));
    assert.ok(fs.readFileSync(path.join(output, file)).equals(expected), file);
  }
}

try {
  for (const file of [...files, 'scripts/build.cjs']) {
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
  fs.writeFileSync(path.join(output, 'stale-file.txt'), 'Must disappear on rebuild');
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assertOutput();

  // Explicit text-only mode must work without a PNG, and must not publish stale icon files.
  const textOnlySource = `${catalogSource}\ntools[0].icon = false;\n`;
  const textOnlyFiles = files.filter(file => file !== 'assets/icons/0.png');
  fs.writeFileSync(path.join(fixture, 'tools.js'), textOnlySource);
  fs.unlinkSync(path.join(fixture, 'assets/icons/0.png'));
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assertOutput(textOnlyFiles, textOnlySource);
  fs.writeFileSync(path.join(fixture, 'assets/icons/0.png'), '<html>Unverified icon must stay excluded</html>');
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assertOutput(textOnlyFiles, textOnlySource);

  fs.copyFileSync(path.join(root, 'assets/icons/0.png'), path.join(fixture, 'assets/icons/0.png'));
  fs.writeFileSync(path.join(fixture, 'tools.js'), catalogSource);
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assertOutput();
  for (const invalid of [null, 0, 'false', {}]) {
    fs.writeFileSync(path.join(fixture, 'tools.js'), `${catalogSource}\ntools[0].icon = ${JSON.stringify(invalid)};\n`);
    result = build();
    assert.notEqual(result.status, 0, 'Only explicit boolean icon modes are accepted');
    assert.match(result.stderr, /tool.icon must be a boolean/);
    assertOutput();
  }
  fs.writeFileSync(path.join(fixture, 'tools.js'), catalogSource);
  fs.unlinkSync(path.join(fixture, 'assets/icons/0.png'));
  result = build();
  assert.notEqual(result.status, 0, 'Missing required icons fail the build');
  assertOutput();
  fs.writeFileSync(path.join(fixture, 'assets/icons/0.png'), '<html>Not an icon</html>');
  result = build();
  assert.notEqual(result.status, 0, 'Misnamed non-PNG icons fail the build');
  assert.match(result.stderr, /Not a PNG/);
  assertOutput();
  console.log(`PASS static build: ${files.length} allowlisted files, identical assets, no private/source artifacts, repeatable output, cwd independence, explicit text-only icons, stale/orphan icon exclusion, strict icon modes, failed input validation preserves previous output`);
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
