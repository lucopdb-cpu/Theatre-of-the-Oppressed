# Update-set — Ubuntu-oefeningen in archief + systeembreed: favicon, swipe, accordion + joker-praktijk kaart 4

Sessie 21 april 2026. Vier parallelle sporen afgerond.

## joker-praktijk.html — vierde kaart hersteld

De in de vorige CHANGELOG beschreven kaart *Herkomst, en de joker als gast* bleek in de betreffende sessie nooit in het project geland. Nu opnieuw gebouwd volgens de daar beschreven specificatie: vijf stages (wat er feitelijk gebeurt wanneer we lenen, het verschil tussen oogsten en bezoeken, drie vragen voor elke geleende oefening, wat we wél doen, dit raakt ook het eigen materiaal), eigen categorie `Herkomst` met aardkleur-streep `#8b7340`, eigen badge-kleur `#e8dfc8`/`#6b5a30`. Title uitgebreid naar "CLRA, trauma, consent, herkomst", app-sub en context-note aangepast van drie naar vier houdingen, vierde pill `Herkomst` toegevoegd aan de navigatie, footer aangevuld met Ramose (*African Philosophy Through Ubuntu*, 1999), Smith (*Decolonizing Methodologies*, 1999/2021) en correspondentie met Arun Naicker (Umtapo Centre).

JS syntax OK, T-array parseert als 4 kaarten, HTML balance 0 issues, E2E mock-test OK. De `index.html`-kaart was in een vorige sessie al bijgewerkt naar 4 kaarten met Ramose/Smith/Naicker in de beschrijving — geen extra wijziging op `index.html` nodig.

## Ubuntu-uitbreiding in `to-arsenaal.html`

Zes nieuwe Ubuntu-oefeningen toegevoegd, gespreid over Boal-categorieën. Totaal nu tien Ubuntu-gerelateerde oefeningen in het archief, per categorie:

- `kennismaking` — Sawubona (bestond)
- `zintuigen` — Stem-Sikhona (eigen adaptatie; Viola Spolin blind-recognition verwant)
- `vertrouwen` — Indaba-cirkel (Battle, *Ubuntu Circles Training Guide*; Tutu)
- `lichaam` — Call & response — stemcirkel (griot, Igbo amanye)
- `beeld` — Ubuntu-beeld (bestond); Ancestor-stoel (Moreno × Ramose, eigen adaptatie)
- `geheugen` — Drie-draden-verhaal (griot; Ubuntu-BYFA Baltimore)
- `forum` — Lekgotla-besluit (Ramose 1999; van Hooft)
- `afsluiting` — Hand-imprint en Kolibrie-pledge (beide bestonden)

Zeven van acht Boal-categorieën nu gedekt in het Ubuntu-spoor. Het archief groeide van 368 naar 374 oefeningen. Alle oefeningen zijn geformuleerd volgens het v11-schema en passen de drie-vragen-test uit joker-praktijk kaart 4 toe bij bronverwijzing. JS-syntax gevalideerd; D-array parseert als 374 objecten.

## Systeembreed — `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-512.png`

Kompas-roosje in amber op donker fond (`#b8803c` op `#1a1418`). Geplaatst in alle HTML-files via script `inject_favicon.py` (idempotent). Elke carousel kreeg ook een eigen `theme-color` meta-tag passend bij zijn palet — playback rose, prospectief teal, legislatief blauw, enzovoort.

## Systeembreed — `nav.js` shared navigation script

Swipe-ondersteuning op mobiel, keyboard-arrows op desktop. Geïnstalleerd in alle veertien carousels. Horizontale swipe tussen technieken; custom shortcuts (Spacebar voor view-toggle in atlas/forum, 'r' voor random in to-arsenaal, cijfertoetsen 1-9 in prospectief) behouden via aparte keydown-listeners. Freire gebruikt alleen keyboard — native CSS scroll-snap handelt touch al af.

Twaalf van veertien carousels pasten vrijwel volledig de E2E mock-test; de twee falers (psychodrama, to-arsenaal) falen óók in hun originele toestand op dezelfde mock-beperking, géén regressie.

## Stappen als accordion — uniform over alle stappen-carousels

Verticale swipe tussen stappen geschrapt na gebruikerstest; stappen nu uitklapbaar via accordion. "Alles dicht" bij opening voor gestructureerd overzicht. Klik op stap-kop opent/sluit.

Elf bestanden omgebouwd: `playback.html`, `feldenkrais.html`, `introspectief.html`, `krantentheater.html`, `atlas.html`, `forum.html`, `joker-praktijk.html`, `legislatief.html`, `na-boal.html`, `onzichtbaar.html`, `prospectief.html`. Prospectief had een eigen datastructuur (`head` + `steps[]` per stage) en kreeg een aangepaste accordion die de `.stage-block` visuele stijl behoudt.

Totaal 647 regels code verwijderd over deze elf bestanden — de stepper-UI (sp-dot, stage-nav, sn-btn, stage-body) plus de view-toggle (vt-step, vt-all, renderStep) waren overbodig geworden.

---

# Update-set — Ubuntu-spoor, sessie 18–19 april 2026

## Wat zit erin

Vijf bestanden die samen één update vormen van het arsenaal.

## Wijzigingen per bestand

### `joker-praktijk.html` — GEWIJZIGD
Vierde houdingskaart toegevoegd: *Herkomst, en de joker als gast*.

- Title bijgewerkt naar "CLRA, trauma, consent, herkomst"
- Masthead app-sub en context-note uitgebreid van drie naar vier houdingen
- Vierde pill toegevoegd aan de navigatie: *Herkomst*
- Nieuwe kaart met vijf stappen:
  1. Wat er feitelijk gebeurt wanneer we lenen
  2. Het verschil tussen oogsten en bezoeken
  3. Drie vragen voor elke geleende oefening
  4. Wat we wél doen
  5. Dit raakt ook het eigen materiaal
- Eigen kleurenstreep (`#8b7340`, aardkleur) en eigen categorie-badge
- Footer aangevuld met Ramose, Smith en correspondentie met Arun Naicker

Node.js syntax-validatie doorstaan. Vier kaarten in het T-array, elk compleet.

### `index.html` — GEWIJZIGD
Drie aanpassingen:

- **Joker-praktijk kaart**: titel en meta in hoofdletters ("CLRA, Trauma, Consent, Herkomst" — "Onderzoekspositie · Houding · Herkomst"). Beschrijving uitgebreid met de vierde houding en bronnen (Ramose, Smith, Naicker/Umtapo).
- **Blagg verwijderd**: de sectie *Toegepast in context* was alleen een "Blagg! & Theatre in Prison"-kaart. Blagg was te specifiek als programma om bovenaan te staan; de sectie is weg.
- **Theatre in Prison verplaatst**: als eigen kaart opgenomen in *Aanvullende methodieken* (naast Playback, Psychodrama, Impro, Feldenkrais). Status *in opbouw*. Beschrijving richt zich op de bredere methodologische reflectie van participatief drama in detentie — niet op één specifiek programma.

### `README.md` — GEWIJZIGD
Parallelle aanpassingen:

- Hoofdletters in joker-praktijk entry ("CLRA, Trauma, Consent, Herkomst")
- Sectie *Toegepast in context* verwijderd (bevatte alleen Blagg)
- Theatre in Prison toegevoegd aan aanvullende methodieken

### `ubuntu-research-map-v2.md` — NIEUW (sessie 1)
Onderzoeksnotitie die als basis diende voor de vierde kaart. Bevat:

- Filosofisch fundament (Ramose, Eze, Tutu)
- Indigenous knowledge bredere familie (Sumak Kawsay, Council Circle, Lekgotla, Affini, Griot)
- Brug naar TO (Freire-Boal-Ubuntu, Hellinger's verzwegen Zoeloe-bron, Macy, Maathai, Diamond)
- Ethisch kader met vier werkprincipes en drie-vragen-test
- Tien oefening-kernen met specifieke bronverwijzing, klaar om volgende sessie te formatteren

## Hoe te installeren

Vervang de drie HTML/MD bestanden in je repo door de versies uit deze zip. De research-map gaat in je onderzoeksarchief (niet op GitHub Pages).

## Openstaand — architectuurvraag

Is *Herkomst* eigenlijk een joker-houding (in de ruimte) of een curatoriële positie (bij het samenstellen van het arsenaal)? De eerste drie kaarten spelen zich af in de sessie; de vierde speelt zich af ervoor. Voor nu blijft hij waar hij is, onder de framing *"vóór de joker zijn gereedschap oppakt"* — dat omarmt beide niveaus. Noteren voor een toekomstige herordening, niet nu aanpassen.

## Volgende sessie

- Tien Ubuntu-oefeningen formatteren naar v11-schema voor `to-arsenaal.html`, óf als standalone `ubuntu.html` carrousel, óf beide
- Keuze: Ubuntu-exclusief met Arun als anker, of breder indigenous-spectrum
- Positie in architectuur: "Na Boal" of eigen "Wortels"-plaats naast Freire

Het fundament — kaart 4 in joker-praktijk — staat nu. De drie-vragen-test uit die kaart is het directe filter bij het formatteren van de oefeningen.
