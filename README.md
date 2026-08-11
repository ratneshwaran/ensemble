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

```
docs/
  index.html         Home page
  about.html         About Ensemble
  research.html      Research focus areas
  events.html        Events, seminars, and roundtables
  ambassadors.html   Ambassador programme (hidden, see below)
  style.css          Stylesheet
  script.js          Mobile nav, scroll reveal, active nav links
  CNAME              Custom domain (ensemblelondon.org)
```

Static site hosted on GitHub Pages from the `docs/` folder.

`ambassadors.html` is deliberately unlinked: it carries `noindex` and appears in no
navigation, footer, or CTA, so it is reachable only by direct URL. The page and its
application form still work. Restoring the programme means re-adding links to it.

## Development

No build step required. Edit the HTML/CSS/JS files in `docs/` directly.

### Running tests

```bash
npm install
npm test
```

Tests cover HTML structure, internal links, navigation consistency, footer integrity, security (no inline scripts, no mixed content, HTTPS resources), accessibility (single h1, aria-labels), and content integrity.

## Links

- [Instagram](https://www.instagram.com/ensemble.london/)
- [LinkedIn](https://www.linkedin.com/company/ensemble-london/)

The hello@ensemblelondon.org address is not published on the site for now; contact
routes point at LinkedIn instead.
