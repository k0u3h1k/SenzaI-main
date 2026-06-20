const fs = require('fs');
const target = process.argv[2] || 'chrome';
const src = `manifests/${target}.json`;
if (fs.existsSync(src)) {
    fs.copyFileSync(src, 'manifest.json');
    console.log(`✓ Switched to ${target} manifest.`);
} else {
    console.log(`✗ Manifest ${src} not found.`);
}
