#!/usr/bin/env python3
"""
Rollout v2: balanced-brace matcher voor keydown handlers.
Behoudt Spacebar-toggles en andere custom shortcuts als apart blok.
"""
import re
from pathlib import Path

OUTPUT = Path("/home/claude/arsenaal/output")
MARKER = "ArsenaalNav.init"
SCRIPT_TAG = '<script src="nav.js" defer></script>'


def ensure_nav_script(content: str) -> str:
    if 'src="nav.js"' in content:
        return content
    return content.replace(
        '<meta name="theme-color"',
        SCRIPT_TAG + '\n<meta name="theme-color"',
        1
    )


def find_keydown_handler(content: str):
    """
    Find full 'document.addEventListener('keydown', ... );' block
    by counting braces. Returns (start, end) or None.
    """
    m = re.search(r"document\.addEventListener\s*\(\s*['\"]keydown['\"]", content)
    if not m:
        return None

    # Find opening { after the arrow function or function() signature
    start = m.start()
    i = m.end()
    # Walk forward to find the first '{' that belongs to the function body
    depth = 0
    # First: skip past '(e) => {' or '(e) {'
    while i < len(content) and content[i] != '{':
        i += 1
    if i >= len(content):
        return None
    # Now at opening brace of function body
    depth = 1
    i += 1
    while i < len(content) and depth > 0:
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
        i += 1
    # After closing brace, consume trailing ');' (with optional whitespace)
    while i < len(content) and content[i] in ' \t\n':
        i += 1
    if i < len(content) and content[i] == ')':
        i += 1
    while i < len(content) and content[i] in ' \t\n':
        i += 1
    if i < len(content) and content[i] == ';':
        i += 1

    return (start, i)


def extract_custom_keys(handler_body: str, navigation_keys=('ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown')):
    """
    Parse a keydown handler and extract if-blocks that handle keys OTHER than arrows.
    Returns a list of preserved if-block source snippets.

    Very simple approach: find 'if ( ... e.key/code ... === 'X' ... ) { ... }'
    and skip those where X is an arrow key.
    """
    preserved = []
    # Iterate over top-level if-blocks
    i = 0
    n = len(handler_body)
    while i < n:
        m = re.search(r'\bif\s*\(', handler_body[i:])
        if not m:
            break
        abs_start = i + m.start()
        # Find matching ')' for the if condition
        depth = 0
        j = i + m.end() - 1  # position at '('
        depth = 1
        j += 1
        while j < n and depth > 0:
            if handler_body[j] == '(':
                depth += 1
            elif handler_body[j] == ')':
                depth -= 1
            j += 1
        # j is now past the ')'. Skip whitespace then expect '{'
        while j < n and handler_body[j] in ' \t\n':
            j += 1
        if j >= n or handler_body[j] != '{':
            i = j
            continue
        # Find matching '}'
        depth = 1
        body_start = j + 1
        j += 1
        while j < n and depth > 0:
            if handler_body[j] == '{':
                depth += 1
            elif handler_body[j] == '}':
                depth -= 1
            j += 1
        condition = handler_body[abs_start:body_start]
        full_block = handler_body[abs_start:j]
        # Is this an arrow-key block? Skip if so
        is_arrow = any(k in condition for k in navigation_keys)
        if not is_arrow:
            preserved.append(full_block)
        i = j
    return preserved


def replace_handler(content: str, init_block: str, preserve_custom=True):
    """Replace keydown handler with init_block. If preserve_custom, keep non-arrow if-blocks."""
    found = find_keydown_handler(content)
    if not found:
        return None, "keydown not found"
    start, end = found
    original = content[start:end]

    preserved_block = ""
    if preserve_custom:
        # Extract the body of the handler (between outer { and })
        body_match = re.search(r'\{(.*)\}', original, re.DOTALL)
        if body_match:
            body = body_match.group(1)
            custom_ifs = extract_custom_keys(body)
            if custom_ifs:
                # Wrap custom keys in a separate keydown listener
                preserved_block = (
                    "// Custom shortcuts blijven via aparte listener\n"
                    "document.addEventListener('keydown', (e) => {\n"
                    "  if (e.altKey || e.ctrlKey || e.metaKey) return;\n"
                    "  " + "\n  ".join(custom_ifs) + "\n"
                    "});\n\n"
                )

    new_content = content[:start] + preserved_block + init_block + content[end:]
    return new_content, "ok"


# ─── Group definitions ─────────────────────────────────────────

GROUP_A = [
    "atlas.html", "forum.html", "joker-praktijk.html",
    "legislatief.html", "na-boal.html", "onzichtbaar.html",
]

GROUP_A_INIT = """window.addEventListener('DOMContentLoaded', () => {
  ArsenaalNav.init({
    horizontal: { next: nextTech,  prev: prevTech  },
    vertical:   { next: nextStage, prev: prevStage }
  });
});"""

GROUP_B = ["feldenkrais.html", "introspectief.html", "krantentheater.html"]

GROUP_B_INIT = """function nextTech() { if (cur < T.length - 1) { cur++; curStage = 0; render(); } }
function prevTech() { if (cur > 0)              { cur--; curStage = 0; render(); } }

window.addEventListener('DOMContentLoaded', () => {
  ArsenaalNav.init({
    horizontal: { next: nextTech,  prev: prevTech  },
    vertical:   { next: nextStage, prev: prevStage }
  });
});"""


def process(filename: str, init_block: str) -> str:
    p = OUTPUT / filename
    content = p.read_text(encoding="utf-8")
    if MARKER in content:
        return f"  · {filename:<28} [already has ArsenaalNav]"
    content = ensure_nav_script(content)
    new_content, msg = replace_handler(content, init_block)
    if new_content is None:
        return f"  ✗ {filename:<28} [{msg}]"
    p.write_text(new_content, encoding="utf-8")
    return f"  ✓ {filename:<28} [replaced]"


def main():
    print("\nGROUP A:")
    for f in GROUP_A:
        print(process(f, GROUP_A_INIT))
    print("\nGROUP B:")
    for f in GROUP_B:
        print(process(f, GROUP_B_INIT))


if __name__ == "__main__":
    main()
