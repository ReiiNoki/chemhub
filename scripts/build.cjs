// Dependency-free static export. Only this allowlist is published to Cloudflare Pages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const catalogSource = fs.readFileSync(path.join(root, 'tools.js'), 'utf8');
const iconModes = vm.runInNewContext(`${catalogSource}\nArray.isArray(tools) ? Array.from(tools, tool => tool.icon) : [];`, {}, { timeout: 1000 });
const count = iconModes.length;
if (!Number.isSafeInteger(count) || count < 1) throw new Error('tools.js must contain a non-empty tools array');
if (iconModes.some(mode => mode !== undefined && typeof mode !== 'boolean')) {
  throw new Error('tool.icon must be a boolean when specified');
}

const files = [
  'index.html', 'design.css', 'app.js', 'tools.js',
  // Only explicit icon:false opts into text-only display; missing required PNGs still fail.
  ...iconModes.flatMap((mode, index) => mode === false ? [] : [`assets/icons/${index}.png`])
];
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex');
// Read and validate inputs before replacing any previously generated output.
const inputs = files.map(file => {
  const data = fs.readFileSync(path.join(root, file));
  if (file.endsWith('.png') && !data.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`Not a PNG: ${file}`);
  }
  return { file, data };
});

// dist/ is generated; source files and locally retained archives are never removed.
fs.rmSync(output, { recursive: true, force: true });
for (const { file, data } of inputs) {
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, data);
}
console.log(`Built dist/: ${count} resources, ${files.length} static files. No tests, previews, documents or source records published.`);
