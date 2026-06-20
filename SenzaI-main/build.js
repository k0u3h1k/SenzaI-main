const fs = require('fs');

const SUPPORTED = ['chrome', 'firefox', 'opera', 'edge'];
const target = (process.argv[2] || 'chrome').toLowerCase();

if (target === 'all') {
  for (const browser of SUPPORTED) {
    const src = `manifests/${browser}.json`;
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, `manifest.${browser}.json`);
      console.log(`✓ Generated manifest.${browser}.json`);
    }
  }
  fs.copyFileSync('manifests/chrome.json', 'manifest.json');
  console.log('✓ Default manifest.json set to Chrome/Edge baseline.');
  process.exit(0);
}

if (!SUPPORTED.includes(target)) {
  console.log(`✗ Unknown target "${target}". Supported: ${SUPPORTED.join(', ')}, all`);
  process.exit(1);
}

const src = `manifests/${target}.json`;
if (fs.existsSync(src)) {
  fs.copyFileSync(src, 'manifest.json');
  console.log(`✓ Switched to ${target} manifest.`);
} else {
  console.log(`✗ Manifest ${src} not found.`);
  process.exit(1);
}
