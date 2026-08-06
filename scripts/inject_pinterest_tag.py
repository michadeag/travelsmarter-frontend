#!/usr/bin/env python3
"""Inject the Pinterest tag site-wide:

1. Base tag (load + page) before </head> on every public page —
   this also builds retargeting audiences ("visited site").
2. A 'lead' event next to every existing gtag generate_lead call —
   fired at the exact moment the PDF email capture succeeds, with the
   visitor's email attached for Pinterest enhanced match.

Idempotent: pages already containing pintrk are skipped for the base tag,
lines already followed by a pintrk call are skipped for the event.
Run from the repo root:  python scripts/inject_pinterest_tag.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAG_ID = "2613473797081"

BASE_TAG = f"""    <!-- Pinterest Tag -->
    <script>
    !function(e){{if(!window.pintrk){{window.pintrk = function () {{
    window.pintrk.queue.push(Array.prototype.slice.call(arguments))}};var
      n=window.pintrk;n.queue=[],n.version="3.0";var
      t=document.createElement("script");t.async=!0,t.src=e;var
      r=document.getElementsByTagName("script")[0];
      r.parentNode.insertBefore(t,r)}}}}("https://s.pinimg.com/ct/core.js");
    pintrk('load', '{TAG_ID}');
    pintrk('page');
    </script>
    <noscript>
    <img height="1" width="1" style="display:none;" alt=""
      src="https://ct.pinterest.com/v3/?event=init&tid={TAG_ID}&noscript=1" />
    </noscript>
    <!-- end Pinterest Tag -->
"""

LEAD_LINE = ("if (window.pintrk) pintrk('track', 'lead', "
             "{ em: (typeof email === 'string' ? email : undefined) });")


def main() -> None:
    base_added = events_added = skipped = 0
    for f in sorted(ROOT.glob("*.html")):
        html = f.read_text(encoding="utf-8")
        orig = html

        if "pintrk" not in html and "</head>" in html:
            html = html.replace("</head>", BASE_TAG + "</head>", 1)
            base_added += 1

        # add lead event after each gtag generate_lead call (once)
        def add_event(m):
            nonlocal events_added
            indent = m.group(1)
            events_added += 1
            return m.group(0) + "\n" + indent + LEAD_LINE

        html = re.sub(
            r"([ \t]*)gtag\('event', 'generate_lead'[^\n]*\);(?![^\n]*\n[ \t]*if \(window\.pintrk\))",
            lambda m: add_event(m),
            html,
        )

        if html != orig:
            f.write_text(html, encoding="utf-8")
        else:
            skipped += 1
    print(f"base-tag added={base_added} lead-events added={events_added} unchanged={skipped}")


if __name__ == "__main__":
    main()
