**Purpose & context**

Luc is building a personal digital toolbox called **"Arsenaal van de Joker"** — a web-based archive of Theatre of the Oppressed (TO) methods and tools for Jokers (TO facilitators/practitioners). The project has no organizational affiliation; it is Luc's own independent research and development effort.

Conceptual anchor phrase (for README and framing): *"Freire beschrijft de kist, Boal bedacht het gereedschap."*

The archive has grown organically through collaborative research sessions: identifying source material → extracting and synthesizing content → building standalone HTML carousels → validating → deploying. Luc drives scope and direction; Claude supports research, synthesis, and technical build.

**Domain:** Theatre of the Oppressed (Boal), Playback Theatre (Fox), Psychodrama (Moreno), Feldenkrais, Impro (Spolin), Paulo Freire's pedagogy, Ubuntu philosophy and indigenous knowledge systems, applied theatre facilitation.

**User's stated preference for working with Claude:** "Be my guide and teacher in the use of Claude. Support wherever you think you can." Treat Luc as a non-developer power user who appreciates step-by-step explanations of Claude-features and tooling, not just task completion.

---

**Current state (as of April 2026)**

Live on GitHub Pages at `https://lucopdb-cpu.github.io/Theatre-of-the-Oppressed/`. Source repo: `github.com/lucopdb-cpu/Theatre-of-the-Oppressed` (public).

Design system: Playfair Display + Source Serif 4 typography, CSS custom properties. **Amber ramp** (used in most carousels): `--amber: #8c5e2a` / `--amber2: #b8803c` / `--amber3: #f0d4a8` / `--amber4: #fdf5e8`. **Exception:** `freire.html` deliberately uses its own earth-palette (`--soil / --earth / --bark / --clay / --sand / --straw / --wheat`) to match the humuslaag framing.

**Main pages (16 carousels + index):**

- `index.html` — landing page, section-based navigation. Includes meta description with anchor phrase, favicon ⚒️ (SVG data-URI), font preconnect.
- `to-arsenaal.html` — core exercise database with sessie-bouwer (session composer); 368 entries; filters on fase/niveau/energie; localStorage persistence.
- `joker-praktijk.html` — 4 houdingskaarten: CLRA, trauma-informed practice, consent-based facilitation, "Herkomst, en de joker als gast".
- `freire.html` — 9 cards (humuslaag), praxis triad, meta-diagnostic card.
- `boal-games.html` — Boal's Games for Actors and Non-Actors in his own categorization.
- `forum.html` — Forum Theater method, 19 cards.
- `krantentheater.html` — 12 technieken.
- `onzichtbaar.html` — 13 cards (protocol + cases + ethics incl. Burstow-critique).
- `legislatief.html` — 13 cards (Boal Rio experiment, TONYC, Katy Rubin/UK).
- `na-boal.html` — 5 cards, methodological innovations post-2009 (Santos, J. Boal, Ganguly, Rubin, Alon).
- `atlas.html` — 14 places where TO-practice lives globally.
- `introspectief.html` — Rainbow of Desire introspective techniques (9), amber palette.
- `prospectief.html` — 15 prospective image techniques (teal/green).
- `playback.html` — 9 Playback forms (Fox), rose/burgundy `#993556`.
- `psychodrama.html` — 24+ cards (Moreno) with TO-bridges.
- `impro.html` — Spolin's improvisation games (previously `spolin-carousel`).
- `feldenkrais.html` — 13 Awareness Through Movement lessons.
- Placeholder on index: "Theatre in Prison" (Thompson / TIPP Centre / Formaat) — shown as "binnenkort".

**`to-arsenaal.html` data schema — 13 fields, D array, compact JS object notation:**

- `b` Boal-categorie: `lichaam, zintuigen, vertrouwen, beeld, geheugen, forum, afsluiting, kennismaking`
- `n` naam
- `t` type
- `d` duur
- `g` groep
- `o` doel
- `s` stappen (array)
- `tg` tags (array)
- `tip` joker-tip
- `bron` bronlabel: `Boal, Formaat, Laos 2004, Grahame Knox, Dreamers Beyond, Wildcard, Theatre for Living, Umtapo 2019, Maathai`
- `fase` sessiefase: opening, opwarming, vertrouwen, beeldentheater, forum, verdieping, nabespreking, repetitie, afsluiting
- `niv` niveau 1–3
- `eng` energie: laag / middel / hoog

**Recent milestone (April 2026):** Ubuntu philosophy integrated as 4 exercises in `to-arsenaal.html` — Sawubona, Ubuntu-beeld, Hand-imprint, Kolibrie-pledge. Ethical framework in `ubuntu-research-map-v2.md` (section 4) governs future indigenous-inspired additions: specific attribution per exercise, no ceremonies, no sacred objects, no closed practices, principles distilled with transparency.

---

**On the horizon**

- **Ubuntu, next round** — 6 further exercises drafted in `ubuntu-research-map-v2.md` (Ubuntu-cirkel check-in, Spreekwoord-wandeling, Proverb-koppels, Constellatie van waarden, Kring-in-kring, Ubuntu's vier vragen). Open question: Ubuntu-only with Naicker anchor vs broader indigenous scope (Sumak Kawsay, Council Circle, Lekgotla).
- **Directe Actie** — own carousel tool still planned. Document explicitly that it is Luc's interpretive addition (not Boal's canonical tree).
- **Theatre in Prison** — "binnenkort"-placeholder live; awaits build.
- Continuing to fill the toolbox through research (Luc's primary ongoing mode).

---

**Key learnings & principles**

- **Source accuracy above all** — errors have been caught by Luc comparing output directly against physical books; always verify against primary sources.
- **"Humuslaag" not "grondlaag"** — Luc's explicit preference for the organic/fertile connotation; applies to Freire framing throughout.
- **Directe Actie as Luc's interpretive addition** — not in Boal's canonical TO tree; treat as such in documentation.
- **No organizational attribution** — carousels are standalone tools with no organizational affiliation; never add attribution footers without explicit instruction.
- **Specific attribution, not generic** (since the Ubuntu-set): every indigenous-inspired exercise names the specific source — people, region, year. Generic "African tradition" or "indigenous circle" is extraction. Principle from `ubuntu-research-map-v2.md` section 4.2.
- **Ethical boundary for indigenous material** — no ceremonies, no sacred objects out of context, no closed practices. Principles distilled transparently is OK.
- Abandoned experiments should be moved on from without dwelling — e.g., the Boal sketch visual identity experiment was explicitly dismissed and should not be resumed unless Luc reinitiates it.
- The toolbox has grown from a single exercise file into a structured multi-carousel archive through iterative research-driven sessions.

---

**Approach & patterns**

Luc's workflow: **research → synthesis shown for approval → format/scope decision confirmed → build → validate → output**. Decisions about scope and destination are confirmed before building begins.

- Luc communicates directly and briefly; expects Claude to move on without dwelling.
- Prefers standalone HTML files over integrations into existing archives where applicable.
- Values practical, joker-oriented framing over theoretical content.
- Works iteratively; catches errors by comparing against source material.
- Always uploads latest file versions to the Claude.ai project; also deploys via GitHub.

**Validation patterns that work:**

- Node.js `eval()` on extracted `const D = [...]` or `const T = [...]` arrays — catches syntax errors without a browser DOM.
- Python `html.parser.HTMLParser` with custom tag-stack checker for balanced HTML. Note: `to-arsenaal.html` has 3 pre-existing "mismatches" caused by HTML tags inside JS strings — not actual errors, just parser noise. `index.html` has 0 mismatches.
- Mock DOM pattern for full JS validation: inline `var` declarations for `document`, `localStorage`, `navigator`, `alert`, `confirm`, `window` before script content.
- Python regex `r'\}\n(\n?)  //'` catches missing commas before comment blocks.
- GitHub form submissions require manual click (CSRF protection blocks JS `form.submit()`).

---

**Tools & resources**

- **Deployment:** GitHub Pages at `https://lucopdb-cpu.github.io/Theatre-of-the-Oppressed/` (repo: `github.com/lucopdb-cpu/Theatre-of-the-Oppressed`; GitHub username: `lucopdb-cpu`; Claude.ai account: `luc@lucopdebeeck.nl`).
- **Editing workflow in Cowork sessions:** Claude clones the public repo in its Linux sandbox (`git clone --depth 1`), edits locally, validates with Node.js + Python balance checker, then delivers the modified file via the outputs folder. Luc uploads to GitHub via the web editor ("Edit this file" → Cmd+A → paste) or "Upload files". GitHub Pages auto-rebuilds in ≈1 minute. Bigger edits are validated with entry-count diffs before delivery.
- **Primary sources:** Boal's *Games for Actors and Non-Actors*, *Rainbow of Desire* (Routledge 1995), *Theatre of the Oppressed*; Freire's *Pedagogy of the Oppressed*; Fox's Playback Theatre writings; Moreno/psychodrama literature; Arun Naicker's Ubuntu Session (Umtapo Centre, Durban, 2019); Ramose's *African Philosophy through Ubuntu* (1999); Eze's *Ubuntu: A Philosophy of Dialogue*; Maathai's Green Belt Movement writings.
- **Claude in Chrome** — enabled; can navigate and operate in browser tabs when MCP-level integration is unavailable.

---

**Retired notes (kept briefly so future sessions don't re-propose them)**

- `boom.html` (Boal's Tree of TO with clickable SVG + `boom-origineel.jpeg`) — never existed in this repo according to full commit-history search (65 commits); parked per Luc's decision April 2026. If resurrection is desired, start fresh.
- `to-archief-v7.html` — earlier name; current is `to-arsenaal.html`.
- "Ubuntu as active reminder" — resolved; integrated April 2026.
- "Legislative Theatre on the horizon" — resolved; `legislatief.html` is live.
- `spolin-carousel` — renamed to `impro.html`.
- Amber accent `#b8803c` as single value — replaced by the full 4-step ramp above.
