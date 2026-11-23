"""Cache-busting: tag the shared CSS/JS links in every page with a hash of the file.

Browsers (and GitHub Pages' caching) can keep serving an old site.css after a deploy,
which leaves new sections unstyled. Run this before committing whenever
assets/css/site.css or assets/js/site.js changes:

    python tools/stamp_assets.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ["assets/css/site.css", "assets/js/site.js"]


def short_hash(path: pathlib.Path) -> str:
    return hashlib.sha1(path.read_bytes()).hexdigest()[:10]


def main() -> None:
    versions = {a: short_hash(ROOT / a) for a in ASSETS}
    for page in sorted(ROOT.glob("*.html")):
        text = page.read_text(encoding="utf-8")
        new = text
        for asset, v in versions.items():
            new = re.sub(re.escape(asset) + r'(\?v=[0-9a-f]+)?"', f'{asset}?v={v}"', new)
        if new != text:
            page.write_text(new, encoding="utf-8")
            print(f"stamped {page.name}")
    print("versions:", versions)


if __name__ == "__main__":
    main()
