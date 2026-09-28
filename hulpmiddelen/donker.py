"""(Hulpmiddel voor onderhoud, geen onderdeel van de site. Vereist: pip install tinycss2)

Donker scherm en mild licht voor pagina's van het Arsenaal van de Joker.

Gebruik: python3 donker.py pagina.html [...]
- voegt <script src="thema.js"></script> toe in de head
- maakt het lichte palet milder (in de bestaande <style>, niet in print)
- voegt een gegenereerd blok toe:  @media screen { html[data-thema="donker"] ... }
  met alle kleurdeclaraties van de pagina, kleuren omgezet via OKLab (lichtheid omgekeerd, tint behouden)
"""
import re, sys, math
import tinycss2

D = 'html[data-thema="donker"]'
MARK_BEGIN = '/* ═══ DONKER SCHERM (gegenereerd, zie thema.js) ═══ */'
MARK_END = '/* ═══ EINDE DONKER SCHERM ═══ */'

# ── kleur ────────────────────────────────────────────────
def srgb_to_lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def lin_to_srgb(c):
    c = max(0.0, min(1.0, c))
    v = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return round(max(0, min(1, v)) * 255)
def to_oklab(r, g, b):
    r, g, b = srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b)
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l, m, s = l ** (1/3), m ** (1/3), s ** (1/3)
    return (0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
            1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
            0.0259040371*l + 0.7827717662*m - 0.8086757660*s)
def from_oklab(L, a, b):
    l = (L + 0.3963377774*a + 0.2158037573*b) ** 3
    m = (L - 0.1055613458*a - 0.0638541728*b) ** 3
    s = (L - 0.0894841775*a - 1.2914855480*b) ** 3
    r = 4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    bb = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    return lin_to_srgb(r), lin_to_srgb(g), lin_to_srgb(bb)

# lichtheid licht -> donker (punten: oorspronkelijke L, nieuwe L)
PUNTEN = [(0.0, 0.97), (0.15, 0.94), (0.25, 0.90), (0.45, 0.79), (0.6, 0.69), (0.75, 0.55), (0.87, 0.33), (0.95, 0.235), (1.0, 0.2)]
def kromme(L):
    for (x0, y0), (x1, y1) in zip(PUNTEN, PUNTEN[1:]):
        if x0 <= L <= x1:
            return y0 + (y1 - y0) * (L - x0) / (x1 - x0)
    return PUNTEN[-1][1]

def donker(rgb):
    L, a, b = to_oklab(*rgb)
    L2 = kromme(L)
    C = math.hypot(a, b)
    f = 1.0
    if L2 < 0.35 and C < 0.01: f = 1.3   # donkere neutrale vlakken iets warmer
    elif L2 < 0.35: f = 0.8
    if C * f > 0.16: f = 0.16 / C
    return from_oklab(L2, a * f, b * f)

def mild(rgb, rol):
    L, a, b = to_oklab(*rgb)
    if L > 0.99 and math.hypot(a, b) < 0.005 and rol in ('vlak', 'var'):
        return (0xfa, 0xf7, 0xf1)       # wit wordt zachte crème
    if rol == 'vlak' and L > 0.94:
        L -= 0.028; k = 1.5 if math.hypot(a, b) < 0.01 else 1.0; a *= k; b *= k
    elif rol in ('tekst', 'var') and L < 0.26:
        L = 0.26 + (L - 0.15) * 0.3 if L > 0.15 else L + 0.06
    elif rol in ('tekst', 'var') and 0.62 < L < 0.72 and math.hypot(a, b) < 0.03:
        L -= 0.05                       # grijze hulptekst iets beter leesbaar
    elif rol == 'var' and L > 0.94:
        L -= 0.028; k = 1.5 if math.hypot(a, b) < 0.01 else 1.0; a *= k; b *= k
    else:
        return None
    return from_oklab(L, a, b)

HEX = re.compile(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b')
RGB = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+%?)\s*)?\)')
NAMED = re.compile(r'(?<![\w-])(white|black)(?![\w-])', re.I)

def fmt(rgb, alpha=None):
    if alpha is None:
        return '#%02x%02x%02x' % rgb
    return 'rgba(%d,%d,%d,%s)' % (*rgb, alpha)

def zet_om(waarde, fn):
    def h(m):
        x = m.group(1)
        if len(x) in (3, 4):
            x = ''.join(c * 2 for c in x)
        rgb = tuple(int(x[i:i+2], 16) for i in (0, 2, 4))
        alpha = None
        if len(x) == 8:
            alpha = round(int(x[6:8], 16) / 255, 3)
        n = fn(rgb)
        return m.group(0) if n is None else fmt(n, alpha)
    def r(m):
        rgb = tuple(int(m.group(i)) for i in (1, 2, 3))
        n = fn(rgb)
        if n is None: return m.group(0)
        return fmt(n, m.group(4)) if m.group(4) else fmt(n)
    def nm(m):
        rgb = (255, 255, 255) if m.group(1).lower() == 'white' else (0, 0, 0)
        n = fn(rgb)
        return m.group(0) if n is None else fmt(n)
    waarde = HEX.sub(h, waarde)
    waarde = RGB.sub(r, waarde)
    waarde = NAMED.sub(nm, waarde)
    return waarde

KLEUR_PROPS = re.compile(r'^(color|background(-color|-image)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?|text-emphasis-color)$')
TEKST_PROPS = re.compile(r'^(color|fill|stroke|text-decoration(-color)?|caret-color)$')

def heeft_kleur(v):
    return bool(HEX.search(v) or RGB.search(v) or NAMED.search(v) or 'var(--' in v)

def prefix_selector(sel):
    delen = []
    for s in split_top(sel, ','):
        s = s.strip()
        if not s: continue
        if s.startswith(':root'):
            delen.append(D + s[5:])
        elif re.match(r'^html\b', s):
            delen.append(D + s[4:])
        else:
            delen.append(D + ' ' + s)
    return ','.join(delen)

def split_top(s, sep):
    out, diep, cur = [], 0, ''
    for c in s:
        if c in '([': diep += 1
        if c in ')]': diep -= 1
        if c == sep and diep == 0:
            out.append(cur); cur = ''
        else:
            cur += c
    out.append(cur)
    return out

def is_kleurvar(naam, waarde):
    return bool(HEX.search(waarde) or RGB.search(waarde) or NAMED.fullmatch(waarde.strip() or 'x'))

def verwerk_regels(regels, uit, diepte=0):
    for rule in regels:
        if rule.type == 'qualified-rule':
            sel = tinycss2.serialize(rule.prelude).strip()
            if sel.startswith(('from', 'to')) or re.match(r'^[\d.]+%', sel):
                continue
            decls = tinycss2.parse_blocks_contents(rule.content, skip_comments=True, skip_whitespace=True)
            nieuw = []
            for d in decls:
                if d.type != 'declaration': continue
                v = tinycss2.serialize(d.value).strip()
                imp = ' !important' if d.important else ''
                if d.name.startswith('--'):
                    if is_kleurvar(d.name, v):
                        nieuw.append('%s:%s%s' % (d.name, zet_om(v, donker), imp))
                elif KLEUR_PROPS.match(d.name) and heeft_kleur(v):
                    nieuw.append('%s:%s%s' % (d.name, zet_om(v, donker), imp))
            if nieuw:
                uit.append('%s{%s}' % (prefix_selector(sel), ';'.join(nieuw)))
        elif rule.type == 'at-rule':
            kw = rule.at_keyword.lower()
            pre = tinycss2.serialize(rule.prelude).strip()
            if kw == 'media' and 'print' not in pre and rule.content is not None:
                binnen = []
                verwerk_regels(tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True), binnen, diepte + 1)
                if binnen:
                    uit.append('@media %s{%s}' % (pre, '\n'.join(binnen)))
            elif kw == 'supports' and rule.content is not None:
                binnen = []
                verwerk_regels(tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True), binnen, diepte + 1)
                if binnen:
                    uit.append('@supports %s{%s}' % (pre, '\n'.join(binnen)))

def mild_css(css):
    """Licht palet milder maken, per declaratie, buiten @media print."""
    stukken, pos = [], 0
    for m in re.finditer(r'@media\s+print\s*\{', css):
        # sla print-blokken over
        start = m.start(); i = m.end(); diep = 1
        while diep and i < len(css):
            if css[i] == '{': diep += 1
            elif css[i] == '}': diep -= 1
            i += 1
        stukken.append((pos, start, True)); stukken.append((start, i, False)); pos = i
    stukken.append((pos, len(css), True))
    uit = []
    for a, b, doe in stukken:
        deel = css[a:b]
        if doe:
            def decl(m):
                naam, waarde = m.group(1), m.group(2)
                if naam.startswith('--'):
                    return naam + ':' + zet_om(waarde, lambda c: mild(c, 'var'))
                if TEKST_PROPS.match(naam):
                    return naam + ':' + zet_om(waarde, lambda c: mild(c, 'tekst'))
                if naam in ('background', 'background-color'):
                    return naam + ':' + zet_om(waarde, lambda c: mild(c, 'vlak'))
                return m.group(0)
            deel = re.sub(r'(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+)', decl, deel)
        uit.append(deel)
    return ''.join(uit)

def verwerk(pad, doe_mild=True):
    s = open(pad, encoding='utf8').read()
    m = re.search(r'<style>(.*?)</style>', s, re.S)
    css = m.group(1)
    al_gedaan = MARK_BEGIN in css
    if al_gedaan: doe_mild = False       # mild licht maar één keer toepassen
    # oud gegenereerd blok weghalen
    css = re.sub(re.escape(MARK_BEGIN) + r'.*?' + re.escape(MARK_END) + r'\n?', '', css, flags=re.S)
    if doe_mild:
        css = mild_css(css)
    regels = tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True)
    uit = []
    verwerk_regels(regels, uit)
    # inline stijlen met kleuren (bv. style="--accent:#8c5e2a; --icon-bg:#fdf5e8"), buiten <script>
    zonder_script = re.sub(r'<script.*?</script>', '', s, flags=re.S)
    gezien = set()
    for st in re.findall(r'\sstyle="([^"]*)"', zonder_script):
        if st in gezien or '${' in st: continue
        gezien.add(st)
        nieuw = []
        for decl in st.split(';'):
            if ':' not in decl: continue
            naam, v = decl.split(':', 1); naam = naam.strip(); v = v.strip()
            if (naam.startswith('--') and is_kleurvar(naam, v)) or (KLEUR_PROPS.match(naam) and (HEX.search(v) or RGB.search(v))):
                nieuw.append('%s:%s !important' % (naam, zet_om(v, donker)))
        if nieuw:
            uit.append('%s [style="%s"]{%s}' % (D, st, ';'.join(nieuw)))
    uit.append('%s body{background:#1a1713}' % D if not any(u.startswith(D + ' body{') for u in uit) else '')
    blok = MARK_BEGIN + '\n@media screen{\n' + '\n'.join(u for u in uit if u) + '\n}\n' + MARK_END + '\n'
    css = css.rstrip() + '\n\n' + blok
    s = s[:m.start(1)] + css + s[m.end(1):]
    if 'src="thema.js"' not in s:
        if '<script src="nav.js"' in s:
            s = s.replace('<script src="nav.js"', '<script src="thema.js"></script>\n<script src="nav.js"', 1)
        else:
            s = s.replace('<style>', '<script src="thema.js"></script>\n<style>', 1)
    open(pad, 'w', encoding='utf8').write(s)
    return len(uit)

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(p, verwerk(p))
