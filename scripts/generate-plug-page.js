// Generates power-plug-checker-{slug}.html pages, one per country,
// synthesizing headline/FAQ text from the same fields the backend uses
// (plugTypes, voltage vs US 120V/type A-B) so content stays consistent
// with the live calculator's output.
// Run: node scripts/generate-plug-page.js scripts/data-plug-countries.js
const fs = require('fs');
const path = require('path');

const US_PLUG_TYPES = ['A', 'B'];
const US_VOLTAGE = 120;

const PLUG_TYPE_DESCRIPTIONS = {
  A: 'flat parallel pins, ungrounded (US/Canada/Japan style)',
  B: 'flat parallel pins plus a round ground pin (US/Canada style)',
  C: 'two round pins, ungrounded ("Europlug")',
  D: 'three round pins in a large triangle (older Indian style)',
  E: 'two round pins plus a female ground hole (French style)',
  F: 'two round pins plus two ground clips ("Schuko", German style)',
  G: 'three rectangular pins (UK/Ireland/Singapore/Hong Kong style)',
  H: 'three flat pins in a triangle (Israeli style)',
  I: 'two flat angled pins (Australia/NZ/China style)',
  J: 'three round pins (Swiss style)',
  K: 'two round pins plus a round ground pin (Danish style)',
  L: 'three round pins in a line (Italian/Chilean style)',
  M: 'three large round pins (South African style)',
  N: 'three round pins, Brazilian/newer South African style',
  O: 'two round pins with a ground pin (Thai style)',
};

function headline(c) {
  const needsAdapter = !c.plugTypes.some(t => US_PLUG_TYPES.includes(t));
  const voltageDiffersSubstantially = Math.abs(c.voltage - US_VOLTAGE) > 20;

  if (!needsAdapter && !voltageDiffersSubstantially) {
    return `${c.name} uses the same plug type and a similar voltage to the US — no adapter needed.`;
  } else if (!needsAdapter && voltageDiffersSubstantially) {
    return `${c.name} uses the same plug shape as the US, but runs on ${c.voltage}V — check your device's voltage rating.`;
  } else if (needsAdapter && !voltageDiffersSubstantially) {
    return `${c.name} uses a different plug shape than the US (Type ${c.plugTypes.join('/')}) — you'll need a plug adapter, but voltage is close enough that a converter usually isn't needed.`;
  }
  return `${c.name} uses a different plug shape (Type ${c.plugTypes.join('/')}) and runs on ${c.voltage}V — you'll need a plug adapter, and possibly a voltage converter for single-voltage devices.`;
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
  const needsAdapter = !c.plugTypes.some(t => US_PLUG_TYPES.includes(t));
  const h = headline(c);
  const plugDescList = c.plugTypes.map(t => `Type ${t} (${PLUG_TYPE_DESCRIPTIONS[t] || 'see local outlets'})`).join(', ');

  const faqs = [
    { q: `What plug type does ${c.name} use?`, a: `${c.name} uses ${plugDescList}.` },
    { q: `Do I need a plug adapter for ${c.name} from the US?`, a: needsAdapter
      ? `Yes — ${c.name}'s outlets use a different shape than US plugs, so you'll need a plug adapter.`
      : `No — ${c.name} uses the same plug shape as the US, so a standard US plug fits without an adapter.` },
    { q: `What voltage does ${c.name} run on?`, a: `${c.name} runs on ${c.voltage}V at ${c.frequency}Hz${c.voltageNote ? `. ${c.voltageNote}` : Math.abs(c.voltage - US_VOLTAGE) > 20 ? ', notably different from the US standard of 120V — check that your device is rated for this voltage before plugging in directly.' : ', close enough to the US standard of 120V that most devices work fine.'}` },
    { q: `Do I need a voltage converter for ${c.name}?`, a: `Most modern electronics (phone and laptop chargers) are dual-voltage (100-240V) and only need a plug adapter, not a converter. Single-voltage, high-wattage devices like hair dryers or straighteners may need an actual voltage converter — check the label near the plug prongs for the input voltage range.` },
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
    <title>${c.name} Power Plug & Voltage Guide | TravelSmarter</title>
    <meta name="description" content="What plug and voltage does ${c.name} use? Instant free checker tells you if you need an adapter or converter, plus a PDF guide.">
    <link rel="canonical" href="https://travelsmarterapp.com/power-plug-checker-${c.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${c.name} Power Plug & Voltage Guide">
    <meta property="og:description" content="Instant free checker: ${h}">
    <meta property="og:url" content="https://travelsmarterapp.com/power-plug-checker-${c.slug}.html">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${c.name} Power Plug & Voltage Guide">
    <meta name="twitter:description" content="Instant free checker: ${h}">

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
        <span class="route-badge">${c.name} · Type ${c.plugTypes.join('/')} · ${c.voltage}V</span>
        <h1>${c.name} Power Plug & Voltage Guide</h1>
        <p>${h}</p>
    </div>

    <div class="container">
        <div class="card">
            <div id="form-section">
                <label for="country">Destination country</label>
                <select id="country">
${countryOptions}
                </select>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Check Requirements</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div class="result-meta" id="result-meta"></div>

                <div id="pdf-section">
                    <p><strong>Want the full guide?</strong> Get a PDF with plug details and adapter-vs-converter guidance for ${c.name} — free.</p>
                    <input type="text" id="firstName" placeholder="First name (optional)">
                    <input type="email" id="email" placeholder="Email address" required>
                    <div id="pdf-alert" class="alert alert-error"></div>
                    <button class="btn btn-secondary" id="pdf-btn" onclick="downloadPdf()">Get Your Free PDF Guide</button>
                </div>
            </div>
        </div>

        <div class="card content-block">
            <h2>${c.name} at a glance</h2>
            <table class="limits-table">
                <tr><td>Plug type${c.plugTypes.length > 1 ? 's' : ''}</td><td>${c.plugTypes.join(', ')}</td></tr>
                <tr><td>Voltage</td><td>${c.voltage}V</td></tr>
                <tr><td>Frequency</td><td>${c.frequency}Hz</td></tr>
                <tr><td>US standard</td><td>Type A/B, 120V, 60Hz</td></tr>
            </table>
            <p>${c.voltageNote || `${plugDescList}.`}</p>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
${faqHtml}
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="power-plug-checker.html">Check a different country →</a>
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
                const res = await fetch(\`\${API_URL}/api/tools/plug-checker/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'power_plug_checker_${c.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                document.getElementById('result-meta').textContent =
                    \`\${data.result.countryName}: Type \${data.result.plugTypes.join('/')} · \${data.result.voltage}V · \${data.result.frequency}Hz\`;
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Check Requirements';
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
                const res = await fetch(\`\${API_URL}/api/tools/plug-checker/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        country: lastResult.country,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'power_plug_checker_${c.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'power-plug-checker-${c.slug}.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
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
  console.error('Usage: node generate-plug-page.js <data-file.js>');
  process.exit(1);
}
const countries = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allCountries = countries.map(c => ({ slug: c.slug, name: c.name }));

countries.forEach(c => {
  const html = render(c, allCountries);
  const outPath = path.join(outDir, `power-plug-checker-${c.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
