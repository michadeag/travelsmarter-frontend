// Generates travel-budget-calculator-to-{slug}.html pages, one per
// destination, pre-selecting that destination and showing budget/mid-range/
// luxury estimates directly on the page (computed from the same base
// daily cost the backend calculator uses).
// Run: node scripts/generate-budget-page.js scripts/data-budget-destinations.js
const fs = require('fs');
const path = require('path');

const STYLE_MULTIPLIERS = { budget: 0.5, 'mid-range': 1.0, luxury: 2.75 };
const STYLE_LABELS = { budget: 'Budget', 'mid-range': 'Mid-range', luxury: 'Luxury' };

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
  const styles = Object.keys(STYLE_MULTIPLIERS).map(s => ({
    key: s, label: STYLE_LABELS[s], daily: Math.round(d.dailyMidRange * STYLE_MULTIPLIERS[s]),
  }));
  const budgetRow = styles.find(s => s.key === 'budget');
  const luxuryRow = styles.find(s => s.key === 'luxury');

  const tableRows = styles.map(s =>
    `                <tr><td>${s.label}</td><td>$${s.daily}/day</td><td>$${(s.daily * 7).toLocaleString('en-US')} for a week</td></tr>`
  ).join('\n');

  const faqs = [
    { q: `How much does a trip to ${d.name} cost per day?`, a: `A mid-range budget runs about $${d.dailyMidRange} per person per day, covering accommodation, food, local transport, and some activities — not including international flights. Budget travelers can get by on roughly $${budgetRow.daily}/day, while a luxury trip typically runs $${luxuryRow.daily}/day or more.` },
    { q: `What's included in this ${d.name} budget estimate?`, a: `Accommodation, food, local transport (public transit, taxis/rideshares), and activities/entrance fees for one person. It does not include international flights, which depend too much on your departure city and booking timing to estimate generically.` },
    { q: `How can I travel to ${d.name} on a budget?`, a: `Book accommodation and flights within the optimal booking window rather than last-minute, eat where locals eat rather than at tourist-area restaurants, use public transit instead of taxis, and mix free activities with a few paid highlights.` },
    { q: `Is ${d.name} expensive compared to other destinations?`, a: `At roughly $${d.dailyMidRange}/day mid-range, ${d.name} is ${d.dailyMidRange >= 150 ? 'on the pricier end compared to many international destinations' : d.dailyMidRange <= 70 ? 'one of the more affordable destinations for the same standard of travel' : 'in the middle of the range compared to other popular destinations'}.` },
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
    <title>${d.name} Travel Budget Calculator — What Will Your Trip Cost? | TravelSmarter</title>
    <meta name="description" content="How much does a trip to ${d.name} cost? Free instant calculator with a daily budget breakdown for budget, mid-range, and luxury travel styles.">
    <link rel="canonical" href="https://travelsmarterapp.com/travel-budget-calculator-to-${d.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${d.name} Travel Budget Calculator">
    <meta property="og:description" content="Free calculator: how much does a trip to ${d.name} cost per day?">
    <meta property="og:url" content="https://travelsmarterapp.com/travel-budget-calculator-to-${d.slug}.html">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${d.name} Travel Budget Calculator">
    <meta name="twitter:description" content="Free calculator: how much does a trip to ${d.name} cost per day?">

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
        select, input[type="number"], input[type="email"], input[type="text"] {
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
        .breakdown-table, .limits-table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:14.5px; }
        .breakdown-table td, .limits-table td { padding:8px 4px; border-bottom:1px solid #f0f0f0; }
        .breakdown-table td:first-child, .limits-table td:first-child { color:#6b7280; }
        .breakdown-table td:last-child, .limits-table td:last-child { text-align:right; font-weight:600; color:#1a2744; }
        #pdf-section { display:none; border-top:1px solid #e5e7eb; margin-top:24px; padding-top:24px; }
        #pdf-section p { color:#6b7280; font-size:14px; margin-bottom:14px; }
        .alert { padding:12px 16px; border-radius:8px; font-size:14px; margin-bottom:14px; display:none; }
        .alert-error { background:#fee2e2; color:#991b1b; }
        .content-block h2 { font-size:1.3em; color:#1a2744; margin-bottom:12px; }
        .content-block p { color:#4b5563; margin-bottom:14px; font-size:15px; }
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
        <span class="route-badge">${d.name} · ~$${d.dailyMidRange}/day mid-range</span>
        <h1>${d.name} Travel Budget Calculator</h1>
        <p>Set your trip length and travel style to get an instant cost estimate for ${d.name} with a full breakdown — free, no sign-up required.</p>
    </div>

    <div class="container">
        <div class="card">
            <div id="form-section">
                <label for="destination">Destination</label>
                <select id="destination">
${destOptions}
                </select>

                <div class="grid-3">
                    <div>
                        <label for="days">Trip length (days)</label>
                        <input type="number" id="days" value="7" min="1" max="60">
                    </div>
                    <div style="grid-column: span 2;">
                        <label for="style">Travel style</label>
                        <select id="style">
                            <option value="budget">Budget</option>
                            <option value="mid-range" selected>Mid-range</option>
                            <option value="luxury">Luxury</option>
                        </select>
                    </div>
                </div>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Calculate My Budget</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <table class="breakdown-table" id="breakdown-table"></table>

                <div id="pdf-section">
                    <p><strong>Want the full report?</strong> Get a PDF with the complete breakdown and money-saving tips for ${d.name} — free.</p>
                    <input type="text" id="firstName" placeholder="First name (optional)">
                    <input type="email" id="email" placeholder="Email address" required>
                    <div id="pdf-alert" class="alert alert-error"></div>
                    <button class="btn btn-secondary" id="pdf-btn" onclick="downloadPdf()">Get Your Free PDF Report</button>
                </div>
            </div>
        </div>

        <div class="card content-block">
            <h2>${d.name} at a glance by travel style</h2>
            <table class="limits-table">
                <tr><td><strong>Style</strong></td><td><strong>Per day</strong></td><td><strong>Per week</strong></td></tr>
${tableRows}
            </table>
            <p>These estimates cover accommodation, food, local transport, and activities per person per day — not international flights.</p>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
${faqHtml}
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="travel-budget-calculator.html">Check a different destination →</a>
    </footer>

    <script>
        let API_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_URL = 'http://localhost:5000';
        } else {
            API_URL = 'https://api.travelsmarterapp.com';
        }

        let lastResult = null;

        function renderBreakdown(breakdown) {
            const table = document.getElementById('breakdown-table');
            table.innerHTML = Object.entries(breakdown).map(([cat, v]) =>
                \`<tr><td>\${cat.charAt(0).toUpperCase() + cat.slice(1)}</td><td>$\${v.daily}/day ($\${v.total.toLocaleString()} total)</td></tr>\`
            ).join('');
        }

        async function calculate() {
            const destination = document.getElementById('destination').value;
            const days = document.getElementById('days').value;
            const style = document.getElementById('style').value;
            const alertEl = document.getElementById('calc-alert');
            alertEl.style.display = 'none';

            if (!days || days < 1) {
                alertEl.textContent = 'Please enter a valid trip length.';
                alertEl.style.display = 'block';
                return;
            }

            const btn = document.getElementById('calc-btn');
            btn.disabled = true;
            btn.textContent = 'Calculating...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/budget-calculator/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destination, days, style }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'travel_budget_calculator_${d.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                renderBreakdown(data.result.breakdown);
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Calculate My Budget';
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
                const res = await fetch(\`\${API_URL}/api/tools/budget-calculator/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        destination: lastResult.destination,
                        days: lastResult.days,
                        style: lastResult.style,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'travel_budget_calculator_${d.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'travel-budget-calculator-${d.slug}.pdf';
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
  console.error('Usage: node generate-budget-page.js <data-file.js>');
  process.exit(1);
}
const destinations = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allDestinations = destinations.map(d => ({ slug: d.slug, name: d.name }));

destinations.forEach(d => {
  const html = render(d, allDestinations);
  const outPath = path.join(outDir, `travel-budget-calculator-to-${d.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
