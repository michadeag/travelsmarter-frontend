#!/usr/bin/env python3
"""Generate 'How Long Can US Citizens Stay in {Country}?' pages.

Pilot for the long-tail programme: question-phrased stay-duration pages,
built from the same vetted visa data that powers the visa checker
(durationDays, advanceAuth, passport validity), styled like the rest of
the site, internally linked to the matching checker tools, with the
visa checker's free PDF as the conversion goal.

Quality gate: countries without complete data are skipped, not padded.

Usage:  python scripts/generate_stay_pages.py data.json
        (data.json = slug -> {name, visaType, durationDays, advanceAuth,
                              passportValidityMonths, note})
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PINTEREST_ID = "2613473797081"
GA_ID = "G-470B6E2DKF"

COUNTRIES = [
    "malaysia", "panama", "costa-rica", "netherlands", "united-arab-emirates",
    "ireland", "turkey", "new-zealand", "morocco", "taiwan", "united-kingdom",
    "mexico", "japan", "thailand", "italy", "france", "spain", "germany",
    "portugal", "greece", "canada", "australia", "indonesia", "vietnam",
    "philippines", "brazil", "colombia", "singapore", "south-korea", "switzerland",
]

VISA_TYPE_LABEL = {
    "visa_free": "No visa needed for tourism",
    "visa_on_arrival": "Visa on arrival",
    "evisa_required": "e-Visa required before travel",
    "eta_required": "Electronic travel authorization required",
    "visa_required": "Visa required",
}


def month_word(n):
    return f"{n} months" if n and n > 1 else ("1 month" if n == 1 else None)


def build_page(slug, d, style_css):
    name = d["name"]
    days = d["durationDays"]
    auth = d.get("advanceAuth")
    passport = d.get("passportValidityMonths")
    note = d["note"]
    vtype = d["visaType"]
    vlabel = VISA_TYPE_LABEL.get(vtype, vtype)
    schengen = "Schengen" in note or "ETIAS" in (auth or "")

    # ---- direct answer, varied by visa regime
    if vtype == "visa_free":
        answer = (f"US citizens can stay in {name} for up to <strong>{days} days</strong> "
                  f"without a visa for tourism.")
    elif vtype == "visa_on_arrival":
        answer = (f"US citizens receive a visa on arrival in {name}, valid for up to "
                  f"<strong>{days} days</strong>.")
    elif vtype in ("evisa_required", "eta_required"):
        answer = (f"With an approved {auth or 'electronic authorization'}, US citizens "
                  f"can stay in {name} for up to <strong>{days} days</strong>.")
    else:
        answer = (f"US citizens need a visa for {name}; tourist visas typically allow "
                  f"stays of up to <strong>{days} days</strong>.")
    if schengen:
        answer += (" This is the shared Schengen limit: 90 days within any 180-day "
                   "period, counted across all Schengen countries combined — not "
                   f"per country. Time spent elsewhere in Schengen reduces your {name} allowance.")

    # ---- at-a-glance rows
    rows = [("Maximum tourist stay", f"{days} days" + (" (in any 180-day period, Schengen-wide)" if schengen else ""))]
    rows.append(("Visa situation", vlabel))
    if auth:
        rows.append(("Before you fly", auth))
    if passport:
        rows.append(("Passport validity required", f"{month_word(passport)} beyond your stay"))
    elif passport == 0:
        rows.append(("Passport validity required", "Valid for the duration of your stay"))
    rows_html = "\n".join(
        f"                <tr><td>{k}</td><td>{v}</td></tr>" for k, v in rows)

    # ---- longer-stay section, varied
    if schengen:
        longer = (f"The 90/180 rule is rolling, not calendar-based: every day you are in "
                  f"the Schengen area during the previous 180 days counts against your "
                  f"limit. For a stay in {name} beyond 90 days you would need a national "
                  f"long-stay visa (work, study, family or — in several EU countries — a "
                  f"digital nomad visa), applied for at a consulate before travel. "
                  f"Border-hopping to a neighbouring Schengen country does not reset the clock.")
    elif vtype == "visa_free" and days and days >= 180:
        longer = (f"{name} is unusually generous: {days} days is one of the longest "
                  f"visa-free windows available to US travelers anywhere. If you want to "
                  f"stay even longer, you'll generally need a residence permit or a "
                  f"long-stay visa arranged in advance — overstaying the tourist window "
                  f"is taken seriously even where entry is easy.")
    else:
        longer = (f"To stay in {name} beyond {days} days you generally need to either "
                  f"apply for an extension with the local immigration authority before "
                  f"your current stay expires, or leave and re-enter — though many "
                  f"countries watch for back-to-back 'visa runs' and can refuse re-entry. "
                  f"For remote workers, a digital nomad or long-stay visa is usually the "
                  f"cleaner path.")

    passport_line = ""
    if passport:
        passport_line = (f"<p>One detail that catches travelers out: {name} expects your "
                         f"passport to remain valid for {month_word(passport)} beyond "
                         f"your planned stay. Airlines enforce this at check-in, so a "
                         f"passport expiring soon can end a trip before it starts — "
                         f"check yours before booking.</p>")

    title = f"How Long Can US Citizens Stay in {name}? ({days} Days — Explained)"
    meta_desc = (f"US citizens can stay in {name} up to {days} days"
                 + (" under the Schengen 90/180 rule" if schengen else "")
                 + f". {vlabel}. Extensions, overstay risks and passport rules — explained.")

    pv_link = ""
    if os.path.exists(ROOT / f"passport-validity-checker-{slug}.html"):
        pv_link = (f'<li><a href="passport-validity-checker-{slug}.html">Passport validity '
                   f'checker for {name}</a> — is your passport valid long enough?</li>')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | TravelSmarter</title>
    <meta name="description" content="{meta_desc}">
    <link rel="canonical" href="https://travelsmarterapp.com/how-long-can-us-citizens-stay-in-{slug}.html">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{meta_desc}">
    <meta property="og:url" content="https://travelsmarterapp.com/how-long-can-us-citizens-stay-in-{slug}.html">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://api.travelsmarterapp.com/og-images/visa-requirement-checker.png">
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){{dataLayer.push(arguments);}}
      gtag('js', new Date());
      gtag('config', '{GA_ID}');
    </script>
    <!-- Pinterest Tag -->
    <script>
    !function(e){{if(!window.pintrk){{window.pintrk = function () {{
    window.pintrk.queue.push(Array.prototype.slice.call(arguments))}};var
      n=window.pintrk;n.queue=[],n.version="3.0";var
      t=document.createElement("script");t.async=!0,t.src=e;var
      r=document.getElementsByTagName("script")[0];
      r.parentNode.insertBefore(t,r)}}}}("https://s.pinimg.com/ct/core.js");
    pintrk('load', '{PINTEREST_ID}');
    pintrk('page');
    </script>
    <!-- end Pinterest Tag -->
    <style>{style_css}</style>
</head>
<body>
    <nav>
        <div class="container"><a href="index.html">✈️ TravelSmarter</a></div>
    </nav>

    <div class="hero">
        <span class="route-badge">{name} · US passport holders</span>
        <h1>How Long Can US Citizens Stay in {name}?</h1>
        <p>{answer}</p>
    </div>

    <div class="container">
        <div class="card content-block">
            <h2>{name} at a glance</h2>
            <table class="limits-table">
{rows_html}
            </table>
            <p>{note}</p>
            <a class="btn" href="visa-requirement-checker-{slug}.html">Check your specific case + free PDF report →</a>
        </div>

        <div class="card content-block">
            <h2>Staying longer than {days} days</h2>
            <p>{longer}</p>
            {passport_line}
        </div>

        <div class="card content-block">
            <h2>What happens if you overstay?</h2>
            <p>Overstaying in {name} — even by a few days — can mean fines, being flagged
            in the immigration system, and trouble on future entries. Some countries also
            bar re-entry for a period proportional to the overstay. The safe play is
            simple: count your days from the entry stamp (not your booking dates), set a
            reminder a week before your limit, and if plans change, deal with immigration
            <em>before</em> the deadline rather than after.</p>
        </div>

        <div class="card content-block">
            <h2>Frequently asked questions</h2>
            <div class="faq-item">
                <h3>Does the {days}-day limit reset if I leave and come back?</h3>
                <p>{"No — for Schengen countries the 90/180 rule keeps counting across borders, so a quick exit does not reset anything." if schengen else "Sometimes, but not reliably. Immigration officers can refuse entry if your passport shows back-to-back tourist stays that look like de-facto residence. One or two re-entries per year for genuine trips are normally fine."}</p>
            </div>
            <div class="faq-item">
                <h3>Do I need anything before I fly to {name}?</h3>
                <p>{f"Yes — {auth}. Arrange it before departure; airlines check at the gate." if auth else f"No advance visa or authorization — for tourist stays, your US passport is enough. Just mind the passport validity rule above."}</p>
            </div>
            <div class="faq-item">
                <h3>Can I work remotely from {name} as a tourist?</h3>
                <p>Working for a foreign employer while visiting is a legal grey zone in
                most countries. For anything beyond answering emails on vacation, check the
                <a href="digital-nomad-visa-checker-{slug}.html">digital nomad visa options for {name}</a> —
                many destinations now have a dedicated permit for exactly this.</p>
            </div>
        </div>

        <div class="card content-block">
            <h2>Related free tools</h2>
            <ul>
                <li><a href="visa-requirement-checker-{slug}.html">Visa requirement checker for {name}</a> — full entry rules + free PDF report</li>
                {pv_link}
                <li><a href="digital-nomad-visa-checker-{slug}.html">Digital nomad visa checker for {name}</a> — options for stays beyond tourism</li>
            </ul>
        </div>
    </div>

    <footer>
        Part of <a href="sales-page.html">TravelSmarter</a> — 87 verified travel hacks, price alerts, and more.<br>
        <a href="free-travel-tools.html">Explore all free travel tools →</a><br>
        <span style="font-size:0.8em;opacity:0.7;">Entry rules change — always confirm with the official embassy or consulate of {name} before booking.</span>
    </footer>
</body>
</html>
"""


def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    style_css = open(sys.argv[2], encoding="utf-8").read() if len(sys.argv) > 2 else ""
    made, skipped = [], []
    for slug in COUNTRIES:
        d = data.get(slug)
        # quality gate: complete data or no page
        if not d or not d.get("durationDays") or not d.get("note"):
            skipped.append(slug)
            continue
        out = ROOT / f"how-long-can-us-citizens-stay-in-{slug}.html"
        out.write_text(build_page(slug, d, style_css), encoding="utf-8")
        made.append(slug)
    print(f"generated={len(made)} skipped={skipped or 'none'}")


if __name__ == "__main__":
    main()
