// Pulls every generated tool og:image from the backend's permanent
// self-hosted copies (https://api.travelsmarterapp.com/og-images/*.png,
// written by toolOgImageService.js) into this repo's own og-images/
// folder, so the actual live pages (which reference
// https://api.travelsmarterapp.com/og-images/{slug}.png) have a real file.
//
// The backend's copy is the freshest source of truth right after a
// "Generate Missing" / "Regenerate All" run in the admin dashboard, but
// it lives on the backend's own disk — run this soon after generating,
// before an unrelated backend deploy could wipe an ephemeral container
// filesystem.
//
// Usage: node scripts/sync-og-images.js [--force]
//   --force  overwrite files that already exist locally (default: skip)
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://api.travelsmarterapp.com';
const OUT_DIR = path.resolve(__dirname, '..', 'og-images');
const force = process.argv.includes('--force');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(resolve));
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { total, images } = await fetchJson(`${API_URL}/api/tool-images`);
  console.log(`Backend reports ${images.length} of ${total} tool categories generated.`);

  let downloaded = 0, skipped = 0, failed = 0;
  for (const { tool_slug, image_url } of images) {
    const destPath = path.join(OUT_DIR, `${tool_slug}.png`);
    if (fs.existsSync(destPath) && !force) {
      skipped++;
      continue;
    }
    try {
      await downloadFile(image_url, destPath);
      console.log(`Downloaded ${tool_slug}.png`);
      downloaded++;
    } catch (err) {
      console.error(`Failed ${tool_slug}.png: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Downloaded ${downloaded}, skipped ${skipped} (already present, use --force to overwrite), failed ${failed}.`);
  if (downloaded > 0) {
    console.log('Now commit and push the og-images/ folder to deploy these.');
  }
}

main().catch((err) => {
  console.error('sync-og-images failed:', err.message);
  process.exit(1);
});
