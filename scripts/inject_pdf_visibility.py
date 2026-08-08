#!/usr/bin/env python3
"""Funnel fix: the free-PDF email form was hidden until the visitor pressed
Calculate — but country pages answer the question in the hero text, so most
visitors never press it and never see the lead magnet at all.

Two changes on every tool page:
1. On load, move #pdf-section out of the hidden #result block into its own
   visible card directly below the tool card (plus a small trust line).
2. Replace the silent `if (!lastResult) return;` dead-end in downloadPdf():
   auto-run calculate() with the page's prefilled defaults, and if that
   still fails, show a helpful message instead of doing nothing.

Idempotent via the pdf-standalone marker.
Run from repo root:  python scripts/inject_pdf_visibility.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SURFACE_SCRIPT = """    <script>
    // Surface the free-PDF signup without requiring a calculation first
    (function () {
        var p = document.getElementById('pdf-section');
        var r = document.getElementById('result');
        if (!p || !r || document.getElementById('pdf-standalone')) return;
        var host = document.createElement('div');
        host.className = 'card content-block';
        host.id = 'pdf-standalone';
        var anchor = r.closest('.card') || document.querySelector('.container .card');
        if (!anchor) return;
        anchor.insertAdjacentElement('afterend', host);
        host.appendChild(p);
        p.style.display = 'block';
        p.style.borderTop = 'none';
        p.style.marginTop = '0';
        p.style.paddingTop = '0';
        var trust = document.createElement('p');
        trust.style.cssText = 'font-size:0.78rem;opacity:0.6;margin-top:10px;';
        trust.textContent = 'Instant download. No spam — unsubscribe anytime.';
        host.appendChild(trust);
    })();
    </script>
"""

OLD_GUARD = "if (!lastResult) return;"
NEW_GUARD = """if (!lastResult && typeof calculate === 'function') {
                try { await calculate(); } catch (e) { /* calculate shows its own alert */ }
            }
            if (!lastResult) {
                alertEl.textContent = 'Please run the free check above first — then your PDF is one click away.';
                alertEl.style.display = 'block';
                return;
            }"""


def main() -> None:
    changed = skipped = 0
    for f in sorted(ROOT.glob("*.html")):
        html = f.read_text(encoding="utf-8")
        if 'id="pdf-section"' not in html or "pdf-standalone" in html:
            skipped += 1
            continue
        if OLD_GUARD not in html or "</body>" not in html:
            skipped += 1
            continue
        html = html.replace(OLD_GUARD, NEW_GUARD, 1)
        html = html.replace("</body>", SURFACE_SCRIPT + "</body>", 1)
        f.write_text(html, encoding="utf-8")
        changed += 1
    print(f"changed={changed} skipped={skipped}")


if __name__ == "__main__":
    main()
