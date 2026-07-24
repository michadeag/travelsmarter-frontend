// Generates packing-list-generator-to-{slug}.html pages, one per
// destination, pre-selecting that destination and showing its climate
// category and example essentials directly on the page.
// Run: node scripts/generate-packing-page.js scripts/data-packing-destinations.js
const fs = require('fs');
const path = require('path');

const CLIMATE_ITEMS = {
  tropical: ['Lightweight, breathable clothing', 'Swimwear', 'Packable rain jacket or poncho', 'Sandals or water shoes', 'Insect repellent', 'Reef-safe sunscreen (SPF 30+)', 'Wide-brim sun hat'],
  desert: ['Lightweight long sleeves for sun protection', 'Scarf or head covering', 'Sturdy closed-toe sandals or breathable shoes', 'Sunglasses (UV protection)', 'High-SPF sunscreen and lip balm', 'Light jacket for cool desert evenings'],
  mediterranean: ['Light layers for warm days', 'Light jacket or cardigan for evenings', 'Comfortable walking shoes', 'Swimwear if visiting the coast', 'Sunglasses and sunscreen'],
  temperate: ['Layerable clothing (weather can shift quickly)', 'Light-to-medium jacket', 'Compact umbrella', 'Comfortable walking shoes', 'One warmer layer even in summer'],
  cold: ['Insulated jacket', 'Thermal base layers', 'Warm hat, gloves, and scarf', 'Waterproof, insulated boots', 'Wool or thermal socks'],
};

const CLIMATE_LABELS = {
  tropical: 'Tropical', desert: 'Desert/arid', mediterranean: 'Mediterranean', temperate: 'Temperate (variable)', cold: 'Cold',
};

const CLIMATE_DESCRIPTIONS = {
  tropical: `warm and humid essentially year-round, with the biggest packing consideration being rain protection and sun/bug defense rather than temperature swings`,
  desert: `hot and dry during the day with a real temperature drop at night, so light sun-protective layers plus one warmer piece both matter`,
  mediterranean: `warm, dry summers and mild, wetter winters — pack lighter for a summer trip and add a layer for shoulder-season or winter travel`,
  temperate: `genuinely variable — weather can shift within the same day, so layering matters more than any single "right" outfit`,
  cold: `cold for most of the year, so insulation and waterproofing matter far more than the number of outfits you bring`,
};

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
  const climateLabel = CLIMATE_LABELS[d.climate];
  const climateItems = CLIMATE_ITEMS[d.climate];
  const climateDesc = CLIMATE_DESCRIPTIONS[d.climate];

  const faqs = [
    { q: `What climate should I pack for in ${d.name}?`, a: `${d.name} has a ${climateLabel.toLowerCase()} climate — ${climateDesc}.` },
    { q: `What are the essential items to pack for ${d.name}?`, a: `Beyond the usual documents and toiletries, prioritize: ${climateItems.slice(0, 4).join(', ').toLowerCase()}.` },
    { q: `How many outfits do I need for a trip to ${d.name}?`, a: `Rather than one outfit per day, plan on roughly one top per 2 days and one bottom per 3 days, plus laundry if your trip runs past a week — the calculator above scales this automatically to your exact trip length.` },
    { q: `Does packing for ${d.name} differ for a business trip?`, a: `Yes — swap beach/activity gear for business attire, a laptop and charger, and a notebook, while keeping the same ${climateLabel.toLowerCase()}-climate essentials underneath.` },
  ];
  const faqHtml = faqs.map(f => `            <div class="faq-item">
                <h3>${f.q}</h3>
                <p>${f.a}</p>
            </div>`).join('\n');

  const destOptions = allDestinations.map(dd =>
    `                    <option value="${dd.slug}"${dd.slug === d.slug ? ' selected' : ''}>${dd.name}</option>`
  ).join('\n');

  const climateItemsHtml = climateItems.map(i => `<li>${i}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${d.name} Packing List — Free Custom Checklist | TravelSmarter</title>
    <meta name="description" content="What to pack for ${d.name}: free instant climate-adjusted packing checklist scaled to your trip length, plus a PDF download.">
    <link rel="canonical" href="https://travelsmarterapp.com/packing-list-generator-to-${d.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${d.name} Packing List — Free Custom Checklist">
    <meta property="og:description" content="Free instant tool: a climate-adjusted, quantity-scaled packing checklist for ${d.name}.">
    <meta property="og:url" content="https://travelsmarterapp.com/packing-list-generator-to-${d.slug}.html">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${d.name} Packing List — Free Custom Checklist">
    <meta name="twitter:description" content="Free instant tool: a climate-adjusted, quantity-scaled packing checklist for ${d.name}.">

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
        .checklist-category { margin-bottom:18px; }
        .checklist-category h3 { font-size:1em; color:#1a2744; margin-bottom:8px; }
        .checklist-category ul { list-style:none; padding:0; }
        .checklist-category li {
            padding:8px 0 8px 28px; position:relative; font-size:14.5px; color:#374151;
            border-bottom:1px solid #f3f4f6;
        }
        .checklist-category li::before {
            content:'☐'; position:absolute; left:0; color:#9ca3af; font-size:16px;
        }
        #pdf-section { display:none; border-top:1px solid #e5e7eb; margin-top:24px; padding-top:24px; }
        #pdf-section p { color:#6b7280; font-size:14px; margin-bottom:14px; }
        .alert { padding:12px 16px; border-radius:8px; font-size:14px; margin-bottom:14px; display:none; }
        .alert-error { background:#fee2e2; color:#991b1b; }
        .content-block h2 { font-size:1.3em; color:#1a2744; margin-bottom:12px; }
        .content-block p { color:#4b5563; margin-bottom:14px; font-size:15px; }
        .content-block ul { color:#4b5563; margin:0 0 14px 20px; font-size:15px; }
        .content-block li { margin-bottom:6px; }
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
        <span class="route-badge">${d.name} · ${climateLabel} climate</span>
        <h1>${d.name} Packing List</h1>
        <p>Set your trip length and type to get a custom, climate-adjusted packing checklist for ${d.name} — free, no sign-up required.</p>
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
                        <label for="tripType">Trip type</label>
                        <select id="tripType">
                            <option value="leisure">Leisure</option>
                            <option value="business">Business</option>
                        </select>
                    </div>
                </div>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Generate My Packing List</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div id="checklist"></div>

                <div id="pdf-section">
                    <p><strong>Want a printable version?</strong> Get this full checklist as a PDF — free.</p>
                    <input type="text" id="firstName" placeholder="First name (optional)">
                    <input type="email" id="email" placeholder="Email address" required>
                    <div id="pdf-alert" class="alert alert-error"></div>
                    <button class="btn btn-secondary" id="pdf-btn" onclick="downloadPdf()">Get Your Free PDF Checklist</button>
                </div>
            </div>
        </div>

        <div class="card content-block">
            <h2>Packing for ${d.name}'s ${climateLabel.toLowerCase()} climate</h2>
            <p>${d.name} is ${climateDesc}. Beyond the standard travel basics, prioritize:</p>
            <ul>${climateItemsHtml}</ul>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
${faqHtml}
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="packing-list-generator.html">Build a list for a different destination →</a>
    </footer>

    <script>
        let API_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_URL = 'http://localhost:5000';
        } else {
            API_URL = 'https://api.travelsmarterapp.com';
        }

        let lastResult = null;

        function renderChecklist(categories) {
            const el = document.getElementById('checklist');
            el.innerHTML = categories.map(cat => \`
                <div class="checklist-category">
                    <h3>\${cat.name}</h3>
                    <ul>\${cat.items.map(i => \`<li>\${i}</li>\`).join('')}</ul>
                </div>
            \`).join('');
        }

        async function calculate() {
            const destination = document.getElementById('destination').value;
            const days = document.getElementById('days').value;
            const tripType = document.getElementById('tripType').value;
            const alertEl = document.getElementById('calc-alert');
            alertEl.style.display = 'none';

            if (!days || days < 1) {
                alertEl.textContent = 'Please enter a valid trip length.';
                alertEl.style.display = 'block';
                return;
            }

            const btn = document.getElementById('calc-btn');
            btn.disabled = true;
            btn.textContent = 'Generating...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/packing-list/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destination, days, tripType }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'packing_list_generator_${d.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                renderChecklist(data.result.categories);
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Generate My Packing List';
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
                const res = await fetch(\`\${API_URL}/api/tools/packing-list/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        destination: lastResult.destination,
                        days: lastResult.days,
                        tripType: lastResult.tripType,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'packing_list_generator_${d.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'packing-list-${d.slug}.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                btn.textContent = '✓ Downloaded — check your email too!';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Get Your Free PDF Checklist';
            }
        }
    </script>
</body>
</html>
`;
}

const dataFile = process.argv[2];
if (!dataFile) {
  console.error('Usage: node generate-packing-page.js <data-file.js>');
  process.exit(1);
}
const destinations = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allDestinations = destinations.map(d => ({ slug: d.slug, name: d.name }));

destinations.forEach(d => {
  const html = render(d, allDestinations);
  const outPath = path.join(outDir, `packing-list-generator-to-${d.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
