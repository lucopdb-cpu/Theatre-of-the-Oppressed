#!/usr/bin/env python3
"""
Voegt favicon-tags en theme-color toe aan alle HTML files.
Idempotent: mag meerdere keren draaien zonder duplicaten.
"""
import re
import os
from pathlib import Path

# Per-carousel theme color (matching the dominant accent)
THEME_COLORS = {
    "index.html":           "#b8803c",  # amber (landing — neutraal)
    "to-arsenaal.html":     "#b8803c",  # amber
    "boal-games.html":      "#8b1a1a",  # rood
    "freire.html":          "#5c3d1e",  # donker amber
    "playback.html":        "#993556",  # rose/burgundy
    "psychodrama.html":     "#e8a87c",  # peach
    "introspectief.html":   "#b8803c",  # amber
    "prospectief.html":     "#1a6b6b",  # teal
    "forum.html":           "#a8321f",  # rood
    "legislatief.html":     "#1a3a5c",  # blauw
    "onzichtbaar.html":     "#2c4a6b",  # blauw
    "atlas.html":           "#2d5a3e",  # groen
    "na-boal.html":         "#8b3a2e",  # terracotta
    "krantentheater.html":  "#8b1a1a",  # rood
    "feldenkrais.html":     "#185FA5",  # blauw
    "impro.html":           "#1a6b8a",  # teal-blauw
    "joker-praktijk.html":  "#4a4f55",  # grijs
}

# De favicon-block die we injecteren
FAVICON_BLOCK = """<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" type="image/x-icon" href="favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<meta name="theme-color" content="{theme}">"""

# Marker zodat we duplicatie kunnen detecteren
MARKER = 'rel="icon" type="image/svg+xml"'


def inject(filepath: Path, theme_color: str) -> tuple[bool, str]:
    """Injecteert favicon-block in <head>. Returns (changed, message)."""
    content = filepath.read_text(encoding="utf-8")

    if MARKER in content:
        # Bestaat al — check of theme-color klopt
        new_theme = f'<meta name="theme-color" content="{theme_color}">'
        content_new = re.sub(
            r'<meta name="theme-color" content="[^"]*">',
            new_theme,
            content,
        )
        if content_new != content:
            filepath.write_text(content_new, encoding="utf-8")
            return True, "updated theme-color"
        return False, "already present"

    block = FAVICON_BLOCK.format(theme=theme_color)

    # Zoek de viewport-meta en plaats onze block direct erna
    viewport_pattern = r'(<meta\s+name="viewport"[^>]*>)'
    if re.search(viewport_pattern, content):
        content_new = re.sub(
            viewport_pattern,
            lambda m: m.group(1) + "\n" + block,
            content,
            count=1,
        )
    else:
        # Fallback: plaats direct na <head>
        content_new = content.replace("<head>", "<head>\n" + block, 1)

    filepath.write_text(content_new, encoding="utf-8")
    return True, "injected"


def main():
    output_dir = Path("/home/claude/arsenaal/output")
    html_files = sorted(output_dir.glob("*.html"))

    print(f"Found {len(html_files)} HTML files\n")
    for f in html_files:
        theme = THEME_COLORS.get(f.name, "#b8803c")
        changed, msg = inject(f, theme)
        status = "✓" if changed else "·"
        print(f"  {status} {f.name:<28} theme={theme}  [{msg}]")


if __name__ == "__main__":
    main()
