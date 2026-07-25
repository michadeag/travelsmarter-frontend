// Generates delay-compensation-checker-{slug}.html pages, one per airline,
// synthesizing FAQ text from the same regime/situation logic the backend
// calculator uses so content stays consistent with the live API. Each page
// defaults to the "delayed 3+ hours" situation (the most commonly searched
// scenario) but keeps the situation dropdown fully selectable.
// Run: node scripts/generate-delay-page.js scripts/data-delay-airlines.js
const fs = require('fs');
const path = require('path');

const REGIME_LABELS = { EU261: 'EU261 applies', US_DOT: 'US DOT rules apply' };

const SITUATION_LABELS = {
  delay_2_3: 'Delayed 2–3 hours',
  delay_3plus: 'Delayed 3+ hours',
  cancelled_short_notice: "Cancelled with less than 14 days' notice",
  denied_boarding: 'Denied boarding (bumped from an oversold flight)',
};

const OUTCOMES = {
  EU261: {
    delay_2_3: { compensation: false, amount: null, note: "EU261 cash compensation only kicks in once your arrival delay reaches 3 hours or more — under that, the airline must still offer free meals, drinks, and two phone calls or emails after roughly a 2-hour wait, but no cash payment yet." },
    delay_3plus: { compensation: true, amount: '€250–€600 depending on flight distance (€250 under 1,500km, €400 for 1,500-3,500km, €600 over 3,500km)', note: "This applies unless the airline can prove 'extraordinary circumstances' — severe weather, air traffic control strikes, or security risks are common exemptions; a technical fault or crew scheduling issue usually isn't." },
    cancelled_short_notice: { compensation: true, amount: '€250–€600 depending on flight distance (€250 under 1,500km, €400 for 1,500-3,500km, €600 over 3,500km)', note: "You're also entitled to a free choice between a full refund or rerouting to your destination, on top of any compensation owed." },
    denied_boarding: { compensation: true, amount: '€250–€600 depending on flight distance (€250 under 1,500km, €400 for 1,500-3,500km, €600 over 3,500km)', note: 'Involuntary denied boarding entitles you to the same fixed compensation as a long delay, plus your choice of a refund or rerouting — and the airline must ask for volunteers first.' },
  },
  US_DOT: {
    delay_2_3: { compensation: false, amount: null, note: "US rules don't require any cash payment for a delay this short — but most major US carriers have voluntarily committed to free rebooking, and meal vouchers if the cause was within the airline's control." },
    delay_3plus: { compensation: false, amount: null, note: "Even at 3+ hours, US rules don't mandate cash compensation for delays — though if the cause was within the airline's control (a maintenance issue, not weather), most major carriers commit to free rebooking, meals, and hotel or ground transport under DOT customer service plans." },
    cancelled_short_notice: { compensation: false, amount: null, note: "If your flight is cancelled, you're legally entitled to a full, automatic cash refund for the unused portion of your ticket if you choose not to travel, plus free rebooking — but there's no extra compensation payment like in the EU." },
    denied_boarding: { compensation: true, amount: 'up to 400% of your one-way fare (capped, doubled if you\'re rebooked very late)', note: "This is the one case where US rules do require cash compensation — if you're involuntarily bumped from an oversold flight, not for ordinary delays or cancellations." },
  },
};

const DEFAULT_SITUATION = 'delay_3plus';

function headline(a, situation) {
  const outcome = OUTCOMES[a.regime][situation];
  const situationLabel = SITUATION_LABELS[situation];
  return `${a.name}, ${situationLabel.toLowerCase()}: ${outcome.compensation ? `you may be owed ${outcome.amount}` : 'no fixed cash compensation applies'}.`;
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

function render(a, allAirlines) {
  const outcome = OUTCOMES[a.regime][DEFAULT_SITUATION];
  const h = headline(a, DEFAULT_SITUATION);
  const deniedOutcome = OUTCOMES[a.regime].denied_boarding;

  const faqs = [
    { q: `Am I owed compensation for a delayed ${a.name} flight?`, a: `${outcome.compensation ? `Yes — for a delay of 3+ hours, you may be owed ${outcome.amount}.` : 'Not automatically for delays alone.'} ${outcome.note}` },
    { q: `What if my ${a.name} flight is cancelled?`, a: OUTCOMES[a.regime].cancelled_short_notice.note },
    { q: `What if I'm bumped from an overbooked ${a.name} flight?`, a: `${deniedOutcome.compensation ? `You may be owed ${deniedOutcome.amount}.` : 'No fixed cash compensation applies.'} ${deniedOutcome.note}` },
    { q: `Which rules apply to ${a.name}?`, a: a.regime === 'EU261' ? `${a.name} is covered by EU261, the EU's air passenger rights regulation, which applies to flights departing the EU or arriving on an EU carrier.` : `${a.name} is a US carrier, so US DOT rules apply rather than the EU's EU261 regulation.` },
  ];
  const faqHtml = faqs.map(f => `            <div class="faq-item">
                <h3>${f.q}</h3>
                <p>${f.a}</p>
            </div>`).join('\n');

  const airlineOptions = allAirlines.map(aa =>
    `                    <option value="${aa.slug}"${aa.slug === a.slug ? ' selected' : ''}>${aa.name}</option>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${a.name} Flight Delay Compensation Checker | TravelSmarter</title>
    <meta name="description" content="Are you owed compensation for a delayed, cancelled, or overbooked ${a.name} flight? Free instant checker plus a PDF claim guide.">
    <link rel="canonical" href="https://travelsmarterapp.com/delay-compensation-checker-${a.slug}.html">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${a.name} Flight Delay Compensation Checker">
    <meta property="og:description" content="Instant free checker: ${h}">
    <meta property="og:url" content="https://travelsmarterapp.com/delay-compensation-checker-${a.slug}.html">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${a.name} Flight Delay Compensation Checker">
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
        <span class="route-badge">${a.name} · ${REGIME_LABELS[a.regime]}</span>
        <h1>${a.name} Flight Delay Compensation Checker</h1>
        <p>${h}</p>
    </div>

    <div class="container">
        <div class="card">
            <div id="form-section">
                <label for="airline">Airline</label>
                <select id="airline">
${airlineOptions}
                </select>

                <label for="situation">What happened</label>
                <select id="situation">
                    <option value="delay_2_3">Delayed 2–3 hours</option>
                    <option value="delay_3plus" selected>Delayed 3+ hours</option>
                    <option value="cancelled_short_notice">Cancelled with less than 14 days' notice</option>
                    <option value="denied_boarding">Denied boarding (bumped from an oversold flight)</option>
                </select>

                <div id="calc-alert" class="alert alert-error"></div>
                <button class="btn" id="calc-btn" onclick="calculate()">Check Compensation</button>
            </div>

            <div id="result">
                <div class="result-headline" id="result-headline"></div>
                <div class="result-meta" id="result-meta"></div>

                <div id="pdf-section">
                    <p><strong>Want the full guide?</strong> Get a PDF with the exact steps to file your ${a.name} claim — free.</p>
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
        <a href="delay-compensation-checker.html">Check a different airline →</a>
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
            const airline = document.getElementById('airline').value;
            const situation = document.getElementById('situation').value;
            const alertEl = document.getElementById('calc-alert');
            alertEl.style.display = 'none';

            const btn = document.getElementById('calc-btn');
            btn.disabled = true;
            btn.textContent = 'Checking...';

            try {
                const res = await fetch(\`\${API_URL}/api/tools/delay-compensation-checker/calculate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ airline, situation }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Something went wrong');

                lastResult = data.result;
                gtag('event', 'tool_calculate', { tool: 'delay_compensation_checker_${a.slug}' });

                document.getElementById('result-headline').textContent = data.result.headline;
                document.getElementById('result-meta').textContent = data.result.note;
                document.getElementById('result').style.display = 'block';
                document.getElementById('pdf-section').style.display = 'block';
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Check Compensation';
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
                const res = await fetch(\`\${API_URL}/api/tools/delay-compensation-checker/pdf\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, firstName,
                        airline: lastResult.airline,
                        situation: lastResult.situation,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to generate PDF');
                }

                gtag('event', 'generate_lead', { tool: 'delay_compensation_checker_${a.slug}' });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a2 = document.createElement('a');
                a2.href = url;
                a2.download = 'delay-compensation-checker-${a.slug}.pdf';
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
  console.error('Usage: node generate-delay-page.js <data-file.js>');
  process.exit(1);
}
const airlines = require(path.resolve(dataFile));
const outDir = path.resolve(__dirname, '..');

const allAirlines = airlines.map(a => ({ slug: a.slug, name: a.name }));

airlines.forEach(a => {
  const html = render(a, allAirlines);
  const outPath = path.join(outDir, `delay-compensation-checker-${a.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log('Wrote', outPath);
});
