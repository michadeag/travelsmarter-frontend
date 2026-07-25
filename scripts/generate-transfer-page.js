// Generates airport-transfer-calculator-{slug}.html pages, one per
// airport, synthesizing FAQ text from the same fields the backend
// calculator uses so content stays consistent with the live API.
// Run: node scripts/generate-transfer-page.js scripts/data-transfer-airports.js
const fs = require('fs');
const path = require('path');

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

function render(a, allAirports) {
  const headline = `At ${a.name}, expect $${a.rideshareLow}-${a.rideshareHigh} for a rideshare (~${a.taxiMinutes} min) or $${a.taxiLow}-${a.taxiHigh} for a taxi to downtown.`;

  const faqs = [
    { q: `How much does a taxi cost from ${a.name} to downtown?`, a: `A taxi from ${a.name} to downtown typically costs $${a.taxiLow}-${a.taxiHigh} and takes about ${a.taxiMinutes} minutes, depending on traffic.` },
    { q: `How much does an Uber or Lyft cost from ${a.name}?`, a: `Rideshare from ${a.name} typically costs $${a.rideshareLow}-${a.rideshareHigh}, usually somewhat cheaper than a taxi, though prices rise with surge pricing during busy periods.` },
    { q: `Is there public transit from ${a.name} to downtown?`, a: a.transitCost !== null
      ? `Yes — ${a.transitOption} runs from ${a.name} to downtown for about $${a.transitCost}, taking roughly ${a.transitMinutes} minutes. It's usually the cheapest option by a wide margin.`
      : `${a.name} doesn't have a direct rail or express transit line to downtown — ${a.transitOption.toLowerCase()}, so taxi or rideshare is the practical choice for most travelers.` },
    { q: `What's the cheapest way to get from ${a.name} to downtown?`, a: a.cheapestOption === 'transit' && a.transitCost !== null
      ? `${a.transitOption} is the cheapest option at about $${a.transitCost}, though it works best with light luggage and a hotel near a station.`
      : `Rideshare is typically the most economical door-to-door option at ${a.name}, since there's no cheaper direct transit alternative.` },
  ];
  const faqHtml = faqs.map(f => `            <div class="faq-item">
                <h3>${f.q}</h3>
                <p>${f.a}</p>
            </div>`).join('\n');

  const airportOptions = allAirports.map(aa =>
    `                    <option value="${aa.slug}"${aa.slug === a.slug ? ' selected' : ''}>${aa.name}</option>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${a.name} Airport Transfer Cost Calculator | TravelSmarter</title>
    <meta name="description" content="How much does it cost to get from ${a.name} to downtown? Free instant calculator comparing taxi, rideshare, and transit, plus a PDF guide.">
    <link rel="canonical" href="https://travelsmarterapp.com/airport-transfer-calculator-${a.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${a.name} Airport Transfer Cost Calculator">
    <meta property="og:description" content="Instant free calculator: ${headline}">
    <meta property="og:url" content="https://travelsmarterapp.com/airport-transfer-calculator-${a.slug}.html">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${a.name} Airport Transfer Cost Calculator">
    <meta name="twitter:description" content="Instant free calculator: ${headline}">

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
        .result-meta { color:#6b7280; font-size:14px; margin-bottom:20px; }
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
        <span class="route-badge">${a.name}</span>
        <h1>${a.name} Airport Transfer Cost Calculator</h1>
        <p>${headline}</p>
    </div>

    <div class="container">
        <div class="card">
            <div id="form-section">
                <label for="airport">Arrival airport</label>
                <select id="airport">
${airportOptions}
                </select>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Compare Transfer Costs</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div class="result-meta" id="result-meta"></div>

                <div id="pdf-section">
                    <p><strong>Want the full guide?</strong> Get a PDF with all your options and tips for a smoother transfer at ${a.name} — free.</p>
                    <input type="text" id="firstName" placeholder="First name (optional)">
                    <input type="email" id="email" placeholder="Email address" required>
                    <div id="pdf-alert" class="alert alert-error"></div>
                    <button class="btn btn-secondary" id="pdf-btn" onclick="downloadPdf()">Get Your Free PDF Guide</button>
                </div>
            </div>
        </div>

        <div class="card content-block">
            <h2>${a.name} transfer options at a glance</h2>
            <table class="limits-table">
                <tr><td>Taxi</td><td>$${a.taxiLow}-${a.taxiHigh} (~${a.taxiMinutes} min)</td></tr>
                <tr><td>Rideshare</td><td>$${a.rideshareLow}-${a.rideshareHigh}</td></tr>
                <tr><td>${a.transitOption}</td><td>${a.transitCost !== null ? `$${a.transitCost} (~${a.transitMinutes} min)` : 'No direct option'}</td></tr>
            </table>
            <p>These are typical, approximate fare ranges, not live quotes — actual prices vary with traffic, time of day, surge pricing, and your exact drop-off point.</p>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
${faqHtml}
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="airport-transfer-calculator.html">Check a different airport →</a>
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
            const airport = document.getElementById('airport').value;
            const alertEl = document.getElementById('calc-alert');
            alertEl.style.display = 'none';

            const btn = document.getElementById('calc-btn');
            btn.disabled = true;
            btn.textContent = 'Comparing...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/airport-transfer-calculator/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ airport }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'airport_transfer_calculator_${a.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                document.getElementById('result-meta').textContent = data.result.transitCost !== null
                    ? \`Cheapest: \${data.result.transitOption}, about $\${data.result.transitCost} (~\${data.result.transitMinutes} min)\`
                    : \`\${data.result.transitOption}\`;
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Compare Transfer Costs';
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
                const res = await fetch(\`\${API_URL}/api/tools/airport-transfer-calculator/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        sourcePage: window.location.pathname,
                        airport: lastResult.airport,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'airport_transfer_calculator_${a.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a2 = document.createElement('a');
                a2.href = url;
                a2.download = 'airport-transfer-calculator-${a.slug}.pdf';
                document.body.appendChild(a2);
                a2.click();
                a2.remove();
                window.URL.revokeObjectURL(url);

                btn.textContent = '✓ Downloaded — check your email too!';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Get Your Free PDF Guide';
            }
        }
    </script>
</body>
</html>
`;
}

const dataFile = process.argv[2];
if (!dataFile) {
  console.error('Usage: node generate-transfer-page.js <data-file.js>');
  process.exit(1);
}
const airports = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allAirports = airports.map(a => ({ slug: a.slug, name: a.name }));

airports.forEach(a => {
  const html = render(a, allAirports);
  const outPath = path.join(outDir, `airport-transfer-calculator-${a.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
