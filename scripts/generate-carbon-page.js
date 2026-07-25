// Generates flight-carbon-calculator-to-{slug}.html pages, one per
// destination, pre-selecting that destination and showing a cabin-class
// comparison table computed from the same distance-band data the backend
// calculator uses.
// Run: node scripts/generate-carbon-page.js scripts/data-carbon-destinations.js
const fs = require('fs');
const path = require('path');

const TRIP_TYPE_DISTANCE_MILES = {
  short_haul: 1500,
  long_haul_transatlantic: 4000,
  long_haul_asia_pacific: 7500,
};

const ECONOMY_KG_PER_MILE = 0.15;
const CABIN_MULTIPLIERS = { economy: 1, 'premium-economy': 1.5, business: 3, first: 4 };
const CABIN_LABELS = { economy: 'Economy', 'premium-economy': 'Premium Economy', business: 'Business', first: 'First' };
const CAR_KG_PER_MILE = 0.4;

function computeRow(oneWayMiles, cabin) {
  const totalMiles = oneWayMiles * 2;
  const totalKgCO2 = Math.round(totalMiles * ECONOMY_KG_PER_MILE * CABIN_MULTIPLIERS[cabin]);
  return { totalKgCO2 };
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

function render(d, allDestinations) {
  const oneWayMiles = TRIP_TYPE_DISTANCE_MILES[d.tripType];
  const rows = Object.keys(CABIN_MULTIPLIERS).map(cabin => ({
    cabin, label: CABIN_LABELS[cabin], ...computeRow(oneWayMiles, cabin),
  }));
  const economyRow = rows.find(r => r.cabin === 'economy');
  const businessRow = rows.find(r => r.cabin === 'business');

  const tableRows = rows.map(r =>
    `                <tr><td>${r.label}</td><td>~${r.totalKgCO2.toLocaleString('en-US')} kg CO2 round-trip</td></tr>`
  ).join('\n');

  const faqs = [
    { q: `How much CO2 does a flight to ${d.name} produce?`, a: `A round-trip economy flight to ${d.name} produces roughly ${economyRow.totalKgCO2.toLocaleString('en-US')} kg of CO2 per person — this is an illustrative estimate based on typical published aviation emission factors, not a precise measurement for your specific flight.` },
    { q: `Does flying business class to ${d.name} really produce more emissions?`, a: `Yes — a round-trip business class flight to ${d.name} produces roughly ${businessRow.totalKgCO2.toLocaleString('en-US')} kg of CO2 per person, about three times the economy figure, since your seat takes up more of the aircraft's total space and fuel burn.` },
    { q: `Is this a precise measurement of my flight's emissions?`, a: `No — it's an illustrative estimate using average distance bands and published emission-factor methodology, not calculated from your specific flight number, aircraft type, or load factor. Airlines and dedicated carbon calculators can offer more precise per-flight figures.` },
    { q: `How can I reduce my flight's carbon footprint to ${d.name}?`, a: `Fly economy rather than premium/business when possible, choose nonstop flights over connections, pack lighter, and consider a reputable verified carbon offset program for emissions you can't avoid.` },
  ];
  const faqHtml = faqs.map(f => `            <div class="faq-item">
                <h3>${f.q}</h3>
                <p>${f.a}</p>
            </div>`).join('\n');

  const destOptions = allDestinations.map(dd =>
    `                    <option value="${dd.slug}"${dd.slug === d.slug ? ' selected' : ''}>${dd.name}</option>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${d.name} Flight Carbon Calculator — CO2 Emissions Estimate | TravelSmarter</title>
    <meta name="description" content="How much CO2 does a flight to ${d.name} produce? Free instant calculator by cabin class, plus a PDF report.">
    <link rel="canonical" href="https://travelsmarterapp.com/flight-carbon-calculator-to-${d.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${d.name} Flight Carbon Calculator">
    <meta property="og:description" content="Free calculator: how much CO2 does a flight to ${d.name} produce?">
    <meta property="og:url" content="https://travelsmarterapp.com/flight-carbon-calculator-to-${d.slug}.html">
    <meta property="og:image" content="https://travelsmarterapp.com/og-images/flight-carbon-calculator.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:image" content="https://travelsmarterapp.com/og-images/flight-carbon-calculator.png">
    <meta name="twitter:title" content="${d.name} Flight Carbon Calculator">
    <meta name="twitter:description" content="Free calculator: how much CO2 does a flight to ${d.name} produce?">

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
        .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
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
        <span class="route-badge">${d.name} · ~${economyRow.totalKgCO2.toLocaleString('en-US')} kg CO2 economy round-trip</span>
        <h1>${d.name} Flight Carbon Calculator</h1>
        <p>Set your cabin class and trip type to get an instant CO2 estimate for your flight to ${d.name} — free, no sign-up required.</p>
    </div>

    <div class="container">
        <div class="card">
            <div id="form-section">
                <label for="destination">Destination</label>
                <select id="destination">
${destOptions}
                </select>

                <div class="grid-3">
                    <div style="grid-column: span 2;">
                        <label for="cabinClass">Cabin class</label>
                        <select id="cabinClass">
                            <option value="economy" selected>Economy</option>
                            <option value="premium-economy">Premium Economy</option>
                            <option value="business">Business</option>
                            <option value="first">First</option>
                        </select>
                    </div>
                    <div>
                        <label for="roundTrip">Trip</label>
                        <select id="roundTrip">
                            <option value="true" selected>Round-trip</option>
                            <option value="false">One-way</option>
                        </select>
                    </div>
                </div>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Calculate My Footprint</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div class="result-meta" id="result-meta"></div>

                <div id="pdf-section">
                    <p><strong>Want the full report?</strong> Get a PDF with ways to reduce your footprint on this trip — free.</p>
                    <input type="text" id="firstName" placeholder="First name (optional)">
                    <input type="email" id="email" placeholder="Email address" required>
                    <div id="pdf-alert" class="alert alert-error"></div>
                    <button class="btn btn-secondary" id="pdf-btn" onclick="downloadPdf()">Get Your Free PDF Report</button>
                </div>
            </div>
        </div>

        <div class="card content-block">
            <h2>Round-trip emissions to ${d.name} by cabin class</h2>
            <table class="limits-table">
                <tr><td><strong>Cabin</strong></td><td><strong>Estimated CO2</strong></td></tr>
${tableRows}
            </table>
            <p>This is an illustrative estimate based on typical published aviation emission factors and average trip distances for this route type — actual emissions vary by aircraft, route, and how full the flight is.</p>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
${faqHtml}
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="flight-carbon-calculator.html">Check a different destination →</a>
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
            const destination = document.getElementById('destination').value;
            const cabinClass = document.getElementById('cabinClass').value;
            const roundTrip = document.getElementById('roundTrip').value;
            const alertEl = document.getElementById('calc-alert');
            alertEl.style.display = 'none';

            const btn = document.getElementById('calc-btn');
            btn.disabled = true;
            btn.textContent = 'Calculating...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/carbon-calculator/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destination, cabinClass, roundTrip }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'flight_carbon_calculator_${d.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                document.getElementById('result-meta').textContent =
                    \`Equivalent to driving about \${data.result.carEquivalentMiles.toLocaleString()} miles in an average car\`;
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Calculate My Footprint';
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
                const res = await fetch(\`\${API_URL}/api/tools/carbon-calculator/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        sourcePage: window.location.pathname,
                        destination: lastResult.destination,
                        cabinClass: lastResult.cabinClass,
                        roundTrip: lastResult.roundTrip,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'flight_carbon_calculator_${d.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'flight-carbon-calculator-${d.slug}.pdf';
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
  console.error('Usage: node generate-carbon-page.js <data-file.js>');
  process.exit(1);
}
const destinations = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allDestinations = destinations.map(d => ({ slug: d.slug, name: d.name }));

destinations.forEach(d => {
  const html = render(d, allDestinations);
  const outPath = path.join(outDir, `flight-carbon-calculator-to-${d.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
