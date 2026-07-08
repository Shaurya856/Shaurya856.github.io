# Portfolio Maintainer Guide

Intended reader: any AI agent or human picking this up cold. Read this before touching any file.

---

## Project overview

Vanilla HTML/CSS/JS personal portfolio, hosted via GitHub Pages at `shaurya856.github.io`. No framework, no build step, no bundler. Three files do everything:

- `index.html` — markup only; no inline styles or scripts
- `styles.css` — all visual styling
- `main.js` — all interactivity

Dev server: `python3 -m http.server` from the repo root, then open `http://localhost:8000`.

---

## File structure

```
index.html         Markup, meta tags, JSON-LD schema, link/script references
styles.css         All CSS, organised in labelled sections
main.js            All JS: scroll-spy, icon rendering, height-lock, card interactions
favicon.*          Favicon variants (png 32, png 16, svg, apple-touch)
preview.png        OG image for social sharing
sitemap.xml        For search indexing
MAINTAINERS.md     This file
```

---

## Content rules — hard constraints, never violate

These apply to any edit touching copy, descriptions, tags, bullets, or labels.

| Rule | Detail |
|------|--------|
| **No "novel"** outside Self-Correcting LLM | The word "novel" is reserved for that project only; it carries IP significance |
| **Patent-pending projects** — describe outputs, not mechanisms | OceanLens and EdgeProctor have filings in progress. Describe what they do, never how. Add "patent filing in progress — implementation details withheld" |
| **Verdikt evidence sources** | Must always list all three: Wikipedia, arXiv, and web search. Do not drop any |
| **MCP lives under Infra & Tools** | Never move it to AI/ML Stack |
| **No "prompt engineering"** as a named skill anywhere | Not in skills panel, not in experience bullets, nowhere |
| **No model or provider names in project cards** | Do not name underlying LLM providers (e.g. OpenAI, Anthropic, Together.ai, Gemini) or model names in any project card. LangGraph/LangChain are tool-layer names and are fine |
| **No academic framing** | No course codes, institution branding, "submission", "coursework", or equivalent phrasing anywhere in any file |

---

## Known architectural quirks

### Height-lock on `.project-card`

**Why it exists:** The bento grid expands cards horizontally via `flex-grow` animation. Without a fixed height, the card's outer height is driven by its children. When a card opens, `.project-summary` collapses and `.project-highlights` expands simultaneously — their overlapping `max-height` transitions cause the card to briefly grow taller, then shrink: a visible bounce.

**How it works:** `lockCardHeights()` in `main.js` runs on `window.load` and on resize (150ms debounce). It clears all `style.height` values, waits one animation frame for the browser to reflow at natural height, then sets each card's `style.height` to its measured `getBoundingClientRect().height`. Cards become fixed-height containers; all content transitions happen inside `overflow: hidden`.

**Implications:** If you add content to a card or change font sizes, the locked height is re-measured on the next page load. During a session, resize recalculates everything. Do not set `height`, `min-height`, or `max-height` on `.project-card` in CSS — the JS-set inline style takes precedence and any CSS value will be ignored.

### Hover oscillation and the 500ms enter delay

Moving the mouse quickly across cards used to cause rapid open/close cycles (oscillation). The fix: `mouseenter` waits 500ms before adding `.open`, and on that callback it forcibly removes `.open` from any sibling still open. `mouseleave` waits 500ms before removing `.open`. This means at card-to-card transitions, the collapsing animation (0.5s CSS) has enough time to complete before the next card opens. Do not reduce these values without testing rapid mouse movement across all four rows.

### Summary snaps, highlights animate

`.project-card.open .project-summary` has `transition: max-height 0s, opacity 0s` — it disappears instantly. This prevents the height-bounce caused by summary and highlights both being mid-transition simultaneously. `.project-highlights` then animates in (0.5s) into the now-empty space. Reversing this order (animating summary out, snapping highlights in) produces a visible gap; don't change it.

### Glow is CSS-only, not tied to `.open`

`.project-card:hover` provides the glow via `box-shadow`. The `.open` class does not set a box-shadow. This means glow appears and disappears instantly as the cursor moves, independent of the 500ms JS delay for expansion. `box-shadow` is intentionally absent from the `transition` property on `.project-card`.

---

## Card structure convention

Every project card must have **genuinely differentiated** summary and highlights:

- **Summary** (`.project-summary`): 3–4 bullets. Lead with the most distinctive fact. Terse, scannable.
- **Highlights** (`.project-highlights`): 5–6 bullets. Fuller detail, parenthetical elaboration, implementation specifics.

They must not be the same list. Identical summary and highlights is a copy-paste error — it has already happened once (Customer Support Agent, Multi-LLM Research Agent at time of writing) and needs to be corrected. The "show more →" interaction is only worth having if the expanded view reveals new information.

---

## Bento grid conventions

**Row patterns (current):**

| Row | Cards | Layout |
|-----|-------|--------|
| 1 | OceanLens (wide) + Self-Correcting LLM | 60:40 |
| 2 | FlowForge + RAG API + Nifty_SLM | equal thirds |
| 3 | EdgeProctor + Verdikt (wide) | 40:60 |
| 4 | DesktopMind + Multi-LLM Research Agent + Customer Support Agent | equal thirds |

**Wide card ratio:** `flex: 1.5 1 0` (wide) vs `flex: 1 1 0` (standard) = 60:40. Do not change this to 2:1 — it was tried and rejected as too aggressive.

**Open card ratio:** `.project-row .project-card.open` gets `flex: 2.5 1 0%`; non-open siblings in the same row compress to `flex: 1 1 0%`. These values are separate from the default wide/standard ratio and should not be conflated.

**Adding a new card:** Pick a row and add a standard `<div class="project-card">` block. If adding a 4th card to a 3-card row, start a new row instead — 4-card rows are too narrow at typical viewport widths. If making a new wide card, ensure its sibling count stays at 1 (wide + standard = 2-card row only).

---

## Mobile phase status

Mobile layout is **explicitly deferred**. The current mobile CSS is a minimal fallback (icon-only sidebar, stacked cards, tap-to-expand). It has not been designed or tested. Do not attempt a mobile pass without separate, explicit instruction. The breakpoint is `max-width: 768px`.

---

## Decision authority

All architecture, content, and design decisions belong to the repo owner. Claude Code's role is implementation only. Do not propose changes to layout, content strategy, project ordering, or interaction design unless explicitly asked. When in doubt, implement the literal instruction and flag any ambiguities — do not resolve them autonomously.
