// Generates sitemap.xml by scanning the repo root for *.html files,
// excluding private/functional pages that shouldn't be indexed.
// Run: node scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://travelsmarterapp.com';

// Private/functional pages — not meant for search indexing.
const EXCLUDE = new Set([
  'account.html', 'auth.html', 'checkout.html', 'reset-password.html',
  'success.html', 'unsubscribe.html', 'welcome.html',
]);

const files = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html'))
  .filter(f => !EXCLUDE.has(f))
  .sort();

const today = new Date().toISOString().slice(0, 10);

const urls = files.map(f => {
  const priority = f === 'index.html' ? '1.0' : '0.7';
  const loc = f === 'index.html' ? `${BASE_URL}/` : `${BASE_URL}/${f}`;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`Wrote sitemap.xml with ${files.length} URLs`);
