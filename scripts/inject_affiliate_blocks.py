#!/usr/bin/env python3
"""Inject contextual affiliate recommendation blocks into free-tool pages.

Config-driven: each partner has a list of tool slugs (matching the backend's
category mapping in tripBriefRegistry.js) and its own copy. Idempotent —
pages already containing that partner's go/ link are skipped, so the script
can be re-run any time a new partner goes live.

All links route through the backend redirect (/api/affiliate/go/<slug>),
so swapping an affiliate URL later never requires touching these pages.

Run from the repo root:  python scripts/inject_affiliate_blocks.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.travelsmarterapp.com/api/affiliate/go"
LOWER = {"and", "of", "the"}

DISCLOSURE = (
    '<p style="font-size:0.75rem;opacity:0.6;margin-top:8px;">Disclosure: if you '
    "buy through this link, TravelSmarter may earn a commission at no extra cost "
    "to you. It keeps our tools free.</p>"
)

PARTNERS = {
    # The 15 canonical Health & Safety tools + accessible-travel-checker.
    "safetywing": {
        "tools": [
            "travel-health-checker", "yellow-fever-checker", "pregnancy-travel-checker",
            "water-safety-checker", "uv-index-checker", "wildlife-safety-checker",
            "natural-disaster-checker", "emergency-number-checker", "tourist-scams-checker",
            "solo-female-travel-checker", "beach-safety-checker", "air-quality-checker",
            "street-food-checker", "altitude-sickness-checker", "travel-advisory-checker",
            "accessible-travel-checker",
        ],
        "title": "&#128737;&#65039; One thing most travelers forget: medical coverage",
        "body": (
            "Hospital bills abroad are the single most expensive travel surprise — and "
            "exactly the kind of risk pages like this one can't protect you from. For "
            "trips to {place}, a travel medical plan like <strong>SafetyWing Nomad "
            "Insurance</strong> covers new illnesses and injuries, hospital stays, "
            "emergency evacuation and lost luggage across 180+ countries, works on a "
            "flexible 4-week subscription, and can even be bought after you've already "
            "left home."
        ),
        "cta": "Check SafetyWing prices &#8594;",
    },
    # Money-category tools (minus resort fees, which pitch Airbnb instead).
    "wise": {
        "tools": [
            "currency-checker", "currency-convertibility-checker", "cash-declaration-checker",
            "atm-fee-checker", "tipping-calculator", "vat-refund-checker",
            "tourist-tax-checker", "departure-tax-checker", "cashless-payment-checker",
            "souvenir-export-checker", "bargaining-checker",
        ],
        "title": "&#128179; Paying in {place} without the hidden markups",
        "body": (
            "Banks and airport kiosks quietly add 3&ndash;7% to every exchange through "
            "worse rates and fees. A <strong>Wise account</strong> converts your money at "
            "the real mid-market rate, holds 40+ currencies, and comes with a card that "
            "works at ATMs and terminals in {place} like a local one — usually the "
            "cheapest way for travelers to spend abroad."
        ),
        "cta": "See how Wise works &#8594;",
    },
    # Connectivity tools -> Saily eSIM.
    "saily": {
        "tools": ["sim-checker", "internet-speed-checker"],
        "title": "&#128241; Skip roaming fees in {place}",
        "body": (
            "Airport SIM booths and roaming plans are the expensive way to get online. "
            "A <strong>Saily eSIM</strong> (by the team behind NordVPN) installs on your "
            "phone before you fly, activates automatically when you land in {place}, "
            "and gives you prepaid data at local prices in 190+ countries — no physical "
            "SIM, no contract, no surprise bill."
        ),
        "cta": "See Saily data plans for {place} &#8594;",
    },
    # Accommodation-fit tools: rental legality + resort-fee pages.
    "airbnb": {
        "tools": ["short-term-rental-checker", "resort-fee-checker"],
        "title": "&#127968; Compare how locals stay in {place}",
        "body": (
            "Hotels aren't the only option — apartments and rooms on "
            "<strong>Airbnb</strong> often cost less for longer stays, skip resort-style "
            "extra fees, and come with a kitchen and laundry. Worth a quick price "
            "comparison for {place} before you book."
        ),
        "cta": "Browse stays in {place} &#8594;",
    },
}


def place_name(slug_rest: str) -> str:
    words = slug_rest.split("-")
    return " ".join(w if w in LOWER else w.capitalize() for w in words)


def block(partner: str, cfg: dict, place: str, page_slug: str) -> str:
    title = cfg["title"].format(place=place)
    body = cfg["body"].format(place=place)
    cta = cfg["cta"].format(place=place)
    return f"""
        <div class="card content-block" id="affiliate-tip-{partner}">
            <h2>{title}</h2>
            <p>{body}</p>
            <a class="btn" href="{API}/{partner}?from={page_slug}" target="_blank" rel="noopener sponsored">{cta}</a>
            {DISCLOSURE}
        </div>

"""


def inject(partner: str, cfg: dict) -> tuple:
    changed = skipped = failed = 0
    for tool in cfg["tools"]:
        for f in sorted(ROOT.glob(f"{tool}-*.html")) + [ROOT / f"{tool}.html"]:
            if not f.exists():
                continue
            html = f.read_text(encoding="utf-8")
            if f"go/{partner}" in html:
                skipped += 1
                continue
            page_slug = f.stem
            rest = page_slug[len(tool):].lstrip("-")
            place = place_name(rest) if rest else "your destination"
            marker = re.search(r"[ \t]*<footer>", html)
            insert_at = html.rfind("</div>", 0, marker.start()) if marker else -1
            if insert_at == -1:
                failed += 1
                print(f"  !! no insertion point: {f.name}", file=sys.stderr)
                continue
            new_html = html[:insert_at] + block(partner, cfg, place, page_slug) + "    " + html[insert_at:]
            f.write_text(new_html, encoding="utf-8")
            changed += 1
    return changed, skipped, failed


def main() -> None:
    for partner, cfg in PARTNERS.items():
        c, s, f = inject(partner, cfg)
        print(f"{partner}: changed={c} skipped={s} failed={f}")


if __name__ == "__main__":
    main()
