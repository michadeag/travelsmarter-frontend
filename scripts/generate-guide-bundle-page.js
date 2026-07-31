// Generates guides-bundle-{country_slug}.html — lists every published
// guide for a country with a single $29 bundle checkout. Same "bake
// content into static HTML at generation time" approach as
// generate-guide-page.js — re-run after adding/editing guides for that
// country and redeploy.
//
// Usage: node scripts/generate-guide-bundle-page.js <country_slug>
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://api.travelsmarterapp.com';

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

function render(data) {
  const { countrySlug, countryName, guides, bundlePriceCents } = data;
  const bundleUSD = (bundlePriceCents / 100).toFixed(2);
  const singleTotal = guides.reduce((sum, g) => sum + g.price_cents, 0) / 100;
  const savings = (singleTotal - bundlePriceCents / 100).toFixed(2);

  const guideListHtml = guides.map(g => `
                <div class="guide-row">
                    <div>
                        <strong>${g.title}</strong>
                        ${g.subtitle ? `<p>${g.subtitle}</p>` : ''}
                    </div>
                    <span class="guide-price">$${(g.price_cents / 100).toFixed(2)}</span>
                </div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${countryName} Guide Bundle — All PDF Guides | TravelSmarter</title>
    <meta name="description" content="Every TravelSmarter PDF guide for ${countryName} — restaurants, attractions, and more — bundled for $${bundleUSD}.">
    <link rel="canonical" href="https://travelsmarterapp.com/guides-bundle-${countrySlug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${countryName} Guide Bundle">
    <meta property="og:description" content="Every TravelSmarter PDF guide for ${countryName}, bundled for $${bundleUSD}.">
    <meta property="og:url" content="https://travelsmarterapp.com/guides-bundle-${countrySlug}.html">

    <script async src="https://www.googletagmanager.com/gtag/js?id=G-470B6E2DKF"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-470B6E2DKF');
    </script>

    <script>
      (function () {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
        fetch('https://api.travelsmarterapp.com/api/analytics/free-tools/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: window.location.pathname }),
          keepalive: true
        }).catch(function () {});
      })();
    </script>

    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
            background:#f9fafb; color:#1f2937; line-height:1.6;
        }
        header {
            background:linear-gradient(135deg,#1a2744 0%,#2d3f6b 100%);
            color:white; padding:18px 0;
        }
        header .container { max-width:760px; margin:0 auto; padding:0 20px; }
        header a { color:#ff6b4a; font-weight:800; font-size:1.2em; text-decoration:none; }
        .hero { max-width:760px; margin:0 auto; padding:50px 20px 20px; text-align:center; }
        .hero h1 { font-size:1.9em; color:#1a2744; margin-bottom:14px; }
        .hero p { color:#6b7280; font-size:1.05em; max-width:600px; margin:0 auto; }
        .container { max-width:760px; margin:0 auto; padding:30px 20px 60px; }
        .card {
            background:white; border-radius:12px; padding:32px;
            box-shadow:0 4px 20px rgba(0,0,0,0.06); margin-bottom:24px;
        }
        .guide-row {
            display:flex; justify-content:space-between; align-items:flex-start; gap:16px;
            padding:14px 0; border-bottom:1px solid #f3f4f6;
        }
        .guide-row:last-child { border-bottom:none; }
        .guide-row strong { color:#1a2744; }
        .guide-row p { color:#6b7280; font-size:13.5px; margin-top:2px; }
        .guide-price { flex-shrink:0; color:#9ca3af; font-weight:700; text-decoration:line-through; }
        .paywall-card { background:linear-gradient(135deg,#1a2744 0%,#2d3f6b 100%); color:white; text-align:center; }
        .paywall-card h2 { font-size:1.3em; margin-bottom:8px; }
        .paywall-card p { color:#c7d2fe; margin-bottom:20px; font-size:14px; }
        .price { font-size:2.2em; font-weight:800; margin-bottom:4px; }
        .price span { font-size:0.4em; font-weight:600; color:#c7d2fe; }
        .savings { color:#86efac; font-weight:700; font-size:14px; margin-bottom:20px; }
        label { display:block; font-weight:600; font-size:14px; margin-bottom:6px; text-align:left; }
        input[type="email"] {
            width:100%; padding:11px 14px; border:1px solid rgba(255,255,255,0.2); border-radius:8px;
            font-size:15px; margin-bottom:14px; background:rgba(255,255,255,0.1); color:white;
        }
        input::placeholder { color:#9ca3af; }
        .btn {
            display:inline-block; background:#ff6b4a; color:white; border:none;
            padding:13px 28px; border-radius:8px; font-weight:700; font-size:15px;
            cursor:pointer; width:100%;
        }
        .btn:disabled { opacity:0.6; cursor:default; }
        .alert { padding:12px 16px; border-radius:8px; font-size:14px; margin-bottom:14px; display:none; }
        .alert-error { background:#fee2e2; color:#991b1b; }
        footer { text-align:center; padding:30px 20px; color:#9ca3af; font-size:13px; }
        footer a { color:#667eea; text-decoration:none; }
    </style>
</head>
<body>
    <header>
        <div class="container"><a href="index.html">✈️ TravelSmarter</a></div>
    </header>

    <div class="hero">
        <h1>${countryName} Guide Bundle</h1>
        <p>Every TravelSmarter PDF guide for ${countryName} — restaurants, attractions, and more — for one flat price.</p>
    </div>

    <div class="container">
        <div class="card">
            <h2 style="font-size:1.15em; color:#1a2744; margin-bottom:8px;">What's included (${guides.length} guide${guides.length !== 1 ? 's' : ''})</h2>
${guideListHtml}
        </div>

        <div class="card paywall-card">
            <h2>Get the whole bundle</h2>
            <p>Includes every guide above — plus any new ${countryName} guide added later, automatically.</p>
            <div class="price">$${bundleUSD} <span>one-time</span></div>
            ${savings > 0 ? `<div class="savings">You save $${savings} vs. buying separately</div>` : ''}

            <div id="checkout-alert" class="alert alert-error"></div>
            <label for="email">Email address</label>
            <input type="email" id="email" placeholder="you@example.com" required>
            <button class="btn" id="checkout-btn" onclick="startCheckout()">Get the Bundle — $${bundleUSD}</button>
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.
    </footer>

    <script>
        let API_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_URL = 'http://localhost:5000';
        } else {
            API_URL = 'https://api.travelsmarterapp.com';
        }

        async function startCheckout() {
            const email = document.getElementById('email').value.trim();
            const alertEl = document.getElementById('checkout-alert');
            alertEl.style.display = 'none';

            if (!email || !email.includes('@')) {
                alertEl.textContent = 'Please enter a valid email address.';
                alertEl.style.display = 'block';
                return;
            }

            const btn = document.getElementById('checkout-btn');
            btn.disabled = true;
            btn.textContent = 'Redirecting to checkout...';

            try {
                const res = await fetch(\`\${API_URL}/api/guides/checkout-bundle\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        countrySlug: '${countrySlug}',
                        email,
                        sourcePage: window.location.pathname,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                gtag('event', 'begin_checkout', { tool: 'guide_bundle_${countrySlug.replace(/-/g, '_')}' });
                window.location.href = data.url;
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Get the Bundle — $${bundleUSD}';
            }
        }
    </script>
</body>
</html>
`;
}

async function main() {
  const countrySlug = process.argv[2];
  if (!countrySlug) {
    console.error('Usage: node generate-guide-bundle-page.js <country_slug>');
    process.exit(1);
  }

  const data = await fetchJson(`${API_URL}/api/guides/public?country=${countrySlug}`);
  if (!data.success) {
    console.error('Failed to fetch guides:', data.error);
    process.exit(1);
  }
  if (data.guides.length === 0) {
    console.error(`No published guides for ${countrySlug} yet — nothing to generate.`);
    process.exit(1);
  }

  // The bundle only makes sense once it's actually cheaper than buying the
  // guides separately — with only a handful of guides published (as in the
  // pilot), $29 can exceed their combined individual price, which would
  // make the "bundle" a worse deal than the guides it's supposedly
  // discounting. Refuse to generate a page that would misrepresent itself.
  const singleTotalCents = data.guides.reduce((sum, g) => sum + g.price_cents, 0);
  if (data.bundlePriceCents >= singleTotalCents) {
    console.error(
      `Refusing to generate: bundle price $${(data.bundlePriceCents / 100).toFixed(2)} is not ` +
      `cheaper than the ${data.guides.length} guide(s) bought separately ($${(singleTotalCents / 100).toFixed(2)}). ` +
      `Publish more guides for ${countrySlug} first, or this page would misleadingly oversell.`
    );
    process.exit(1);
  }

  const html = render(data);
  const outPath = path.resolve(__dirname, '..', `guides-bundle-${countrySlug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
