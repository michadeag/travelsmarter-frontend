// Generates travel-health-checker-{slug}.html pages, one per country,
// synthesizing headline/FAQ text from the same fields the backend uses
// so content stays consistent with the live calculator's output.
// Run: node scripts/generate-health-page.js scripts/data-health-countries.js
const fs = require('fs');
const path = require('path');

const MALARIA_LABELS = { none: 'No malaria risk', low: 'Low malaria risk', moderate: 'Moderate malaria risk', high: 'High malaria risk' };

function headline(c) {
  if (c.yellowFeverEntryRequirement) {
    return `${c.name} commonly requires proof of yellow fever vaccination for entry — verify with the embassy based on your travel history.`;
  } else if (c.malariaRisk === 'high' || c.malariaRisk === 'moderate') {
    return `${c.name} has ${MALARIA_LABELS[c.malariaRisk].toLowerCase()} in parts of the country — talk to a travel clinic about prevention.`;
  } else if (c.malariaRisk === 'low') {
    return `${c.name} has some malaria risk in certain regions — check whether your specific itinerary is affected.`;
  }
  return `${c.name} has no significant malaria or yellow fever concerns — routine vaccines are generally sufficient.`;
}

function faqJsonLd(faqs) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }, null, 2);
}

function render(c, allCountries) {
  const h = headline(c);
  const recList = c.commonRecommended.map(i => `<li>${i}</li>`).join('');

  const faqs = [
    { q: `Do I need vaccines to visit ${c.name}?`, a: `Commonly recommended items for ${c.name} include: ${c.commonRecommended.join(', ').toLowerCase()}. This is general orientation, not medical advice — confirm with a travel clinic 4-6 weeks before departure.` },
    { q: `Is yellow fever vaccination required for ${c.name}?`, a: c.yellowFeverEntryRequirement
      ? `${c.name} commonly requires proof of yellow fever vaccination for entry. This typically depends on your travel history (which countries you've visited recently), not just a direct flight from the US — verify the exact requirement with the embassy for your specific itinerary.`
      : `${c.name} does not commonly require yellow fever vaccination for entry from the US, though it may still be recommended for certain regions within the country — check the specific area on your itinerary.` },
    { q: `What is the malaria risk in ${c.name}?`, a: `${MALARIA_LABELS[c.malariaRisk]}${c.malariaRisk !== 'none' ? '. Risk is often concentrated in specific rural or border regions rather than spread evenly across the whole country — a travel clinic can advise based on your exact itinerary.' : '.'}` },
    { q: `When should I get travel vaccines before visiting ${c.name}?`, a: `Visit a travel medicine clinic or your doctor 4-6 weeks before departure — some vaccines need time to become effective or require multiple doses spaced weeks apart.` },
  ];
  const faqHtml = faqs.map(f => `            <div class="faq-item">
                <h3>${f.q}</h3>
                <p>${f.a}</p>
            </div>`).join('\n');

  const countryOptions = allCountries.map(cc =>
    `                    <option value="${cc.slug}"${cc.slug === c.slug ? ' selected' : ''}>${cc.name}</option>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c.name} Travel Health Guide — Vaccines & Malaria Risk | TravelSmarter</title>
    <meta name="description" content="Do you need vaccines for ${c.name}? Free instant orientation on yellow fever requirements, malaria risk, and recommended vaccines, plus a PDF guide.">
    <link rel="canonical" href="https://travelsmarterapp.com/travel-health-checker-${c.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${c.name} Travel Health Guide">
    <meta property="og:description" content="Instant free orientation: ${h}">
    <meta property="og:url" content="https://travelsmarterapp.com/travel-health-checker-${c.slug}.html">
    <meta property="og:image" content="https://travelsmarterapp.com/og-images/travel-health-checker.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:image" content="https://travelsmarterapp.com/og-images/travel-health-checker.png">
    <meta name="twitter:title" content="${c.name} Travel Health Guide">
    <meta name="twitter:description" content="Instant free orientation: ${h}">

    <script type="application/ld+json">
    ${faqJsonLd(faqs)}
    </script>

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
        .route-badge {
            display:inline-block; background:#f0f4ff; color:#1a2744; font-weight:700;
            font-size:14px; padding:8px 16px; border-radius:20px; margin-bottom:20px;
        }
        label { display:block; font-weight:600; font-size:14px; margin-bottom:6px; color:#374151; }
        select, input[type="email"], input[type="text"] {
            width:100%; padding:11px 14px; border:1px solid #e5e7eb; border-radius:8px;
            font-size:15px; margin-bottom:18px;
        }
        .btn {
            display:inline-block; background:#ff6b4a; color:white; border:none;
            padding:13px 28px; border-radius:8px; font-weight:700; font-size:15px;
            cursor:pointer; width:100%;
        }
        .btn:disabled { opacity:0.6; cursor:default; }
        .btn-secondary { background:#1a2744; }
        #result { display:none; }
        .result-headline {
            background:#f0f4ff; border-radius:10px; padding:20px; font-weight:700;
            color:#1a2744; margin-bottom:16px; font-size:1.05em;
        }
        .result-meta { color:#6b7280; font-size:14px; margin-bottom:12px; }
        .result-list { color:#4b5563; font-size:14.5px; margin:0 0 20px 20px; }
        .result-list li { margin-bottom:4px; }
        .disclaimer { background:#fef3c7; color:#92400e; padding:12px 16px; border-radius:8px; font-size:13px; margin-bottom:16px; }
        #pdf-section { display:none; border-top:1px solid #e5e7eb; margin-top:24px; padding-top:24px; }
        #pdf-section p { color:#6b7280; font-size:14px; margin-bottom:14px; }
        .alert { padding:12px 16px; border-radius:8px; font-size:14px; margin-bottom:14px; display:none; }
        .alert-error { background:#fee2e2; color:#991b1b; }
        .content-block h2 { font-size:1.3em; color:#1a2744; margin-bottom:12px; }
        .content-block p { color:#4b5563; margin-bottom:14px; font-size:15px; }
        .limits-table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:14.5px; }
        .limits-table td { padding:8px 4px; border-bottom:1px solid #f0f0f0; }
        .limits-table td:first-child { color:#6b7280; }
        .limits-table td:last-child { text-align:right; font-weight:600; color:#1a2744; }
        .faq-item { margin-bottom:18px; }
        .faq-item h3 { font-size:1.02em; color:#1a2744; margin-bottom:6px; }
        .faq-item p { color:#4b5563; font-size:14.5px; }
        footer { text-align:center; padding:30px 20px; color:#9ca3af; font-size:13px; }
        footer a { color:#667eea; text-decoration:none; }
    </style>
</head>
<body>
    <header>
        <div class="container"><a href="index.html">✈️ TravelSmarter</a></div>
    </header>

    <div class="hero">
        <span class="route-badge">${c.name} · ${MALARIA_LABELS[c.malariaRisk]}</span>
        <h1>${c.name} Travel Health Guide</h1>
        <p>${h}</p>
    </div>

    <div class="container">
        <div class="card">
            <div class="disclaimer">This tool provides general educational orientation, not medical advice. Always confirm with the CDC (cdc.gov/travel) and a travel medicine clinic before your trip.</div>
            <div id="form-section">
                <label for="country">Destination country</label>
                <select id="country">
${countryOptions}
                </select>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Check Health Info</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div class="result-meta" id="result-meta"></div>
                <ul class="result-list" id="result-list"></ul>

                <div id="pdf-section">
                    <p><strong>Want the full report?</strong> Get a PDF with pre-trip health prep steps for ${c.name} — free.</p>
                    <input type="text" id="firstName" placeholder="First name (optional)">
                    <input type="email" id="email" placeholder="Email address" required>
                    <div id="pdf-alert" class="alert alert-error"></div>
                    <button class="btn btn-secondary" id="pdf-btn" onclick="downloadPdf()">Get Your Free PDF Report</button>
                </div>
            </div>
        </div>

        <div class="card content-block">
            <h2>${c.name} at a glance</h2>
            <table class="limits-table">
                <tr><td>Yellow fever proof for entry</td><td>${c.yellowFeverEntryRequirement ? 'Commonly required' : 'Not commonly required'}</td></tr>
                <tr><td>Malaria risk</td><td>${MALARIA_LABELS[c.malariaRisk]}</td></tr>
            </table>
            <p>Commonly recommended for this destination:</p>
            <ul>${recList}</ul>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
${faqHtml}
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="travel-health-checker.html">Check a different country →</a>
    </footer>

    <script>
        let API_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_URL = 'http://localhost:5000';
        } else {
            API_URL = 'https://api.travelsmarterapp.com';
        }

        let lastResult = null;

        async function calculate() {
            const country = document.getElementById('country').value;
            const alertEl = document.getElementById('calc-alert');
            alertEl.style.display = 'none';

            const btn = document.getElementById('calc-btn');
            btn.disabled = true;
            btn.textContent = 'Checking...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/health-checker/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'travel_health_checker_${c.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                document.getElementById('result-meta').textContent = \`\${data.result.countryName}: \${data.result.malariaRiskLabel}\${data.result.yellowFeverEntryRequirement ? ' · Yellow fever proof commonly required' : ''}\`;
                document.getElementById('result-list').innerHTML = data.result.commonRecommended.map(i => \`<li>\${i}</li>\`).join('');
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Check Health Info';
            }
        }

        async function downloadPdf() {
            const email = document.getElementById('email').value.trim();
            const firstName = document.getElementById('firstName').value.trim();
            const alertEl = document.getElementById('pdf-alert');
            alertEl.style.display = 'none';

            if (!email || !email.includes('@')) {
                alertEl.textContent = 'Please enter a valid email address.';
                alertEl.style.display = 'block';
                return;
            }
            if (!lastResult) return;

            const btn = document.getElementById('pdf-btn');
            btn.disabled = true;
            btn.textContent = 'Generating your PDF...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/category-bundle/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        sourcePage: window.location.pathname,
                        country: lastResult.country,
                        category: 'Health & Safety',
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'travel_health_checker_${c.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'health-safety-bundle-${c.slug}.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                btn.textContent = '✓ Downloaded — check your email too!';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Get Your Free PDF Report';
            }
        }
    </script>
</body>
</html>
`;
}

const dataFile = process.argv[2];
if (!dataFile) {
  console.error('Usage: node generate-health-page.js <data-file.js>');
  process.exit(1);
}
const countries = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allCountries = countries.map(c => ({ slug: c.slug, name: c.name }));

countries.forEach(c => {
  const html = render(c, allCountries);
  const outPath = path.join(outDir, `travel-health-checker-${c.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
