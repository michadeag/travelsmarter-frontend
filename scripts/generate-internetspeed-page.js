// Generates internet-speed-checker-{slug}.html pages, one per country,
// synthesizing FAQ text from the same fields the backend calculator uses
// so content stays consistent with the live API.
// Run: node scripts/generate-internetspeed-page.js scripts/data-internetspeed-countries.js
const fs = require('fs');
const path = require('path');

const SPEED_LABELS = {
  fast: 'fast — reliable broadband and mobile data widely available, well-suited to video calls and heavy remote work',
  moderate: 'moderate — generally workable but expect occasional slowdowns, especially outside major cities',
  slow: 'slow — connectivity can be inconsistent, so build in backup plans for anything time-sensitive',
};
const NOMAD_LABELS = {
  yes: 'a dedicated digital nomad visa is available',
  no: 'no dedicated digital nomad visa exists — you would need a standard visa or work-permit route',
  partial: 'no formal digital nomad visa, but long-stay tourist or similar visas make extended remote work practical',
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

function render(c, allCountries) {
  const speedTierLabel = SPEED_LABELS[c.speedTier];
  const nomadLabel = NOMAD_LABELS[c.digitalNomadVisa];
  const headline = `${c.name}'s internet is ${speedTierLabel} On the visa side, ${nomadLabel}.`;

  const faqs = [
    { q: `How good is the internet in ${c.name}?`, a: `${c.name}'s internet is ${speedTierLabel} ${c.note}` },
    { q: `Is there a digital nomad visa for ${c.name}?`, a: `In ${c.name}, ${nomadLabel}.` },
    { q: `Can I work remotely from ${c.name} on a tourist visa?`, a: c.digitalNomadVisa === 'yes' ? `A dedicated nomad visa exists, which is generally the safer and more explicit route for remote work, though tourist-visa norms may also apply for shorter stays.` : `Rules vary, but many tourist visas technically restrict any form of work, even remote work for a foreign employer — check current terms before committing to a long remote stint.` },
    { q: `What's the best city in ${c.name} for remote work?`, a: c.note },
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
    <title>Internet Speed & Remote Work Checker for ${c.name} | TravelSmarter</title>
    <meta name="description" content="How's the internet in ${c.name}, and is there a digital nomad visa? Free instant checker, plus a PDF guide.">
    <link rel="canonical" href="https://travelsmarterapp.com/internet-speed-checker-${c.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="Internet Speed & Remote Work Checker for ${c.name}">
    <meta property="og:description" content="Instant free checker: ${headline}">
    <meta property="og:url" content="https://travelsmarterapp.com/internet-speed-checker-${c.slug}.html">
    <meta property="og:image" content="https://travelsmarterapp.com/og-images/internet-speed-checker.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:image" content="https://travelsmarterapp.com/og-images/internet-speed-checker.png">
    <meta name="twitter:title" content="Internet Speed & Remote Work Checker for ${c.name}">
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
        select, input[type="email"], input[type="text"], input[type="number"] {
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
        .result-headline.warn { background:#fee2e2; color:#991b1b; }
        .result-headline.caution { background:#fffbeb; color:#92400e; }
        .result-meta { color:#6b7280; font-size:14px; margin-bottom:20px; }
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
        <span class="route-badge">${c.name} · ${c.speedTier} internet</span>
        <h1>Internet Speed & Remote Work Checker for ${c.name}</h1>
        <p>${headline}</p>
    </div>

    <div class="container">
        <div class="card">
            <div id="form-section">
                <label for="country">Destination country</label>
                <select id="country">
${countryOptions}
                </select>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Check Internet & Nomad Visa</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div class="result-meta" id="result-meta"></div>

                <div id="pdf-section">
                    <p><strong>Want the full guide?</strong> Get a PDF with tips for ${c.name} — free.</p>
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
        <a href="internet-speed-checker.html">Check a different country →</a>
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
                const res = await fetch(\`\${API_URL}/api/tools/internet-speed-checker/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'internet_speed_checker_${c.slug}' });

                const headlineEl = document.getElementById('result-headline');
                headlineEl.textContent = data.result.headline;
                headlineEl.className = 'result-headline' + (data.result.speedTier === 'slow' ? ' warn' : data.result.speedTier === 'moderate' ? ' caution' : '');
                document.getElementById('result-meta').textContent = data.result.note;
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Check Internet & Nomad Visa';
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
                const res = await fetch(\`\${API_URL}/api/tools/internet-speed-checker/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        sourcePage: window.location.pathname,
                        country: lastResult.country,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'internet_speed_checker_${c.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'internet-speed-checker-${c.slug}.pdf';
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
  console.error('Usage: node generate-internetspeed-page.js <data-file.js>');
  process.exit(1);
}
const countries = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allCountries = countries.map(c => ({ slug: c.slug, name: c.name }));

countries.forEach(c => {
  const html = render(c, allCountries);
  const outPath = path.join(outDir, `internet-speed-checker-${c.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
