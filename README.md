# Ensemble

A London-based research and community organisation working at the intersection of AI safety, governance, and the philosophy of artificial intelligence.

**Website:** [ensemblelondon.org](https://ensemblelondon.org)

## About

Ensemble exists to close the gap between the people building AI and the conversations about what it should become. We produce original research, run public programmes, and build a community across London's universities and research institutions.

### Focus areas

- **AI Safety** — Alignment, robustness, interpretability, and value specification
- **AI Governance** — Regulation, institutional design, standards, and international coordination
- **Philosophy of AI** — Agency, consciousness, moral status, and human autonomy

## Site structure

The site is a single page.

```
docs/
  index.html         The site: hero, who we are, what we work on, programme
  about.html         Redirect stub -> /
  research.html      Redirect stub -> /
  events.html        Redirect stub -> /
  ambassadors.html   Ambassador programme (hidden, see below)
  style.css          Stylesheet
  script.js          Mobile nav, scroll reveal, active nav links
  CNAME              Custom domain (ensemblelondon.org)
```

Static site hosted on GitHub Pages from the `docs/` folder.

`about.html`, `research.html`, and `events.html` used to be full pages. They are now
bare `meta refresh` stubs carrying `noindex` and a canonical pointing at the site
root, kept only so links already shared elsewhere do not 404. They hold no content:
edit `index.html` instead.

`ambassadors.html` is deliberately unlinked: it carries `noindex` and appears in no
navigation, footer, or CTA, so it is reachable only by direct URL. The page and its
application form still work. Restoring the programme means re-adding links to it. It
still uses the multi-page layout and header, so `style.css` retains the component
styles it depends on.

## Development

No build step required. Edit the HTML/CSS/JS files in `docs/` directly.

### Design system

Monochrome by design: there is no accent colour beyond `--ink` (black). If you find
yourself reaching for a hue, that is a deliberate constraint, not an omission.

Two faces, both from Google Fonts: **IBM Plex Mono** (`--font-sans`) carries all the
chrome — nav, buttons, eyebrow labels, section numbers — at small sizes, uppercase,
with wide tracking. **Lora** (`--font-serif`) carries everything you actually read:
the headline, prose, and the pull quote.

Type is fluid. The `--fs-*` tokens in `:root` use `clamp()`, so each size scales
continuously from phone to desktop and no `font-size` is restated inside a media
query. If you need to change a size, change the token, not the breakpoint.

Corners are square everywhere (`border-radius: 0`), which is what gives the page its
document rather than app feel.

Breakpoints: 1024px (hero stacks, thin-ruled rows stay three across), 768px (rows
collapse to one column), 480px (small-phone tightening).

### Running tests

```bash
npm install
npm test
```

Tests cover HTML structure, internal links, navigation consistency, footer integrity, security (no inline scripts, no mixed content, HTTPS resources), accessibility (single h1, aria-labels), and content integrity.

## Links

- [Instagram](https://www.instagram.com/ensemble.london/) (hidden on the site for now)
- [LinkedIn](https://www.linkedin.com/company/ensemble-london/)

The hello@ensemblelondon.org address is not published on the site for now; contact
routes point at LinkedIn instead.

The Instagram icon is commented out of the footer rather than deleted, so the only
social link on the site is LinkedIn. Uncommenting it in `index.html` and
`ambassadors.html` brings it back.
