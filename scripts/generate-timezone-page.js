// Generates time-zone-checker-to-{slug}.html pages, one per destination
// country, with the origin defaulted to United States (both dropdowns
// remain fully user-editable) — mirrors the destination-axis pattern used
// by jet-lag-calculator/best-time-to-book-flights, adapted for a tool that
// genuinely needs two country inputs instead of one.
// Run: node scripts/generate-timezone-page.js scripts/data-timezone-countries.js
const fs = require('fs');
const path = require('path');

const DEFAULT_ORIGIN_SLUG = 'united-states';

function formatHour(h) {
  let hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  hh = ((hh % 24) + 24) % 24;
  const period = hh < 12 ? 'AM' : 'PM';
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
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

function render(c, allCountries, originDefault) {
  const offsetDiff = c.utcOffset - originDefault.utcOffset;
  const absDiff = Math.abs(offsetDiff);
  const direction = offsetDiff > 0 ? 'ahead of' : offsetDiff < 0 ? 'behind' : 'the same time as';
  const headline = absDiff === 0
    ? `${c.name} is the same time as ${originDefault.name}.`
    : `${c.name} is ${absDiff % 1 === 0 ? absDiff : absDiff.toFixed(1)} hours ${direction} ${originDefault.name}.`;
  const morningInDest = formatHour((9 + offsetDiff + 24) % 24);
  const eveningInDest = formatHour((18 + offsetDiff + 24) % 24);

  const faqs = [
    { q: `What time is it in ${c.name} compared to the United States?`, a: `${headline} If it's 9:00 AM in the United States, it's ${morningInDest} in ${c.name}.` },
    { q: `Does ${c.name} observe daylight saving time?`, a: c.dstNote || `${c.name} does not have any notable daylight saving complications to be aware of.` },
    { q: `When is the best time to call someone in ${c.name}?`, a: absDiff <= 3 ? `Easy — waking hours overlap substantially, so most normal call times work.` : absDiff <= 8 ? `There's a real overlap window, but you'll likely need to plan around it — try your evening if ${c.name} is ahead, or your morning if it's behind.` : `Limited overlap — expect one side to take an early morning or late night call given the large time difference.` },
    { q: `Is ${c.name} in a single time zone?`, a: `Check the specific region — some countries span multiple time zones, and this tool uses a major-city reference rather than an exact per-region calculation.` },
  ];
  const faqHtml = faqs.map(f => `            <div class="faq-item">
                <h3>${f.q}</h3>
                <p>${f.a}</p>
            </div>`).join('\n');

  const countryOptions = allCountries.map(cc =>
    `                    <option value="${cc.slug}">${cc.name}</option>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Time Zone Checker: United States to ${c.name} | TravelSmarter</title>
    <meta name="description" content="What's the time difference between the US and ${c.name}? Free instant checker with best call times, plus a PDF guide.">
    <link rel="canonical" href="https://travelsmarterapp.com/time-zone-checker-to-${c.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="Time Zone Checker: United States to ${c.name}">
    <meta property="og:description" content="Instant free checker: ${headline}">
    <meta property="og:url" content="https://travelsmarterapp.com/time-zone-checker-to-${c.slug}.html">
    <meta property="og:image" content="https://travelsmarterapp.com/og-images/time-zone-checker.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:image" content="https://travelsmarterapp.com/og-images/time-zone-checker.png">
    <meta name="twitter:title" content="Time Zone Checker: United States to ${c.name}">
    <meta name="twitter:description" content="Instant free checker: ${headline}">

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
        .row { display:flex; gap:14px; }
        .row > div { flex:1; }
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
        .result-meta { color:#6b7280; font-size:14px; margin-bottom:8px; }
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
        <span class="route-badge">United States → ${c.name}</span>
        <h1>Time Zone Checker: United States to ${c.name}</h1>
        <p>${headline}</p>
    </div>

    <div class="container">
        <div class="card">
            <div id="form-section">
                <div class="row">
                    <div>
                        <label for="origin">Your location</label>
                        <select id="origin">
${countryOptions}
                        </select>
                    </div>
                    <div>
                        <label for="destination">Destination</label>
                        <select id="destination">
${countryOptions}
                        </select>
                    </div>
                </div>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Check Time Difference</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div class="result-meta" id="result-morning"></div>
                <div class="result-meta" id="result-evening"></div>
                <div class="result-meta" id="result-difficulty"></div>

                <div id="pdf-section">
                    <p><strong>Want the full guide?</strong> Get a PDF with call-time tips — free.</p>
                    <input type="text" id="firstName" placeholder="First name (optional)">
                    <input type="email" id="email" placeholder="Email address" required>
                    <div id="pdf-alert" class="alert alert-error"></div>
                    <button class="btn btn-secondary" id="pdf-btn" onclick="downloadPdf()">Get Your Free PDF Guide</button>
                </div>
            </div>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
${faqHtml}
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="time-zone-checker.html">Check a different route →</a>
    </footer>

    <script>
        let API_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_URL = 'http://localhost:5000';
        } else {
            API_URL = 'https://api.travelsmarterapp.com';
        }

        document.getElementById('origin').value = '${DEFAULT_ORIGIN_SLUG}';
        document.getElementById('destination').value = '${c.slug}';

        let lastResult = null;

        async function calculate() {
            const origin = document.getElementById('origin').value;
            const destination = document.getElementById('destination').value;
            const alertEl = document.getElementById('calc-alert');
            alertEl.style.display = 'none';

            const btn = document.getElementById('calc-btn');
            btn.disabled = true;
            btn.textContent = 'Checking...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/time-zone-checker/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ origin, destination }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'time_zone_checker_${c.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                document.getElementById('result-morning').textContent = data.result.morningExample;
                document.getElementById('result-evening').textContent = data.result.eveningExample;
                document.getElementById('result-difficulty').textContent = data.result.difficultyLabel;
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Check Time Difference';
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
                const res = await fetch(\`\${API_URL}/api/tools/time-zone-checker/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        sourcePage: window.location.pathname,
                        origin: lastResult.origin,
                        destination: lastResult.destination,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'time_zone_checker_${c.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'time-zone-checker-${c.slug}.pdf';
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
  console.error('Usage: node generate-timezone-page.js <data-file.js>');
  process.exit(1);
}
const countries = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allCountries = countries.map(c => ({ slug: c.slug, name: c.name }));
const originDefault = countries.find(c => c.slug === DEFAULT_ORIGIN_SLUG);
if (!originDefault) {
  console.error(`Default origin "${DEFAULT_ORIGIN_SLUG}" not found in data file`);
  process.exit(1);
}

countries.forEach(c => {
  const html = render(c, allCountries, originDefault);
  const outPath = path.join(outDir, `time-zone-checker-to-${c.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
