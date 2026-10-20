# Aelvyn website

Source for [aelvyn.com](https://aelvyn.com): a static site (HTML, CSS, a little JavaScript), no build step. Deployed to Hostinger from GitHub.

| File | Purpose |
|---|---|
| `index.html` | Home page: masthead, the work, one invoice (interactive preview), control, two languages, built on, where we stand, who it is for, questions, early access |
| `about.html` | About Aelvyn |
| `contact.html` | Contact form and map |
| `blog.html` | Notes index |
| `blog-back-office-tasks-ai-agents.html` | Note: Five back-office tasks a UAE business can hand to an agent |
| `blog-why-our-agents-ask-first.html` | Note: Why every AI agent we build asks before it acts |
| `privacy.html`, `terms.html` | Legal pages |
| `404.html` | Not-found page (served from any path by `.htaccess`, so it uses root-relative links) |
| `styles.css` | All styles: design tokens (paper, ink, one ink-blue accent), layout, components |
| `script.js` | Mobile menu, contents marker, invoice preview, language toggle, the early-access and contact forms (Web3Forms with mailto fallback and an on-page status line) |
| `assets/logo-mark.svg`, `assets/logo.svg` | Logo mark and full logo. The mark is the favicon; the pages themselves render a type-only wordmark and no images |
| `assets/og-image.png` | Social preview image, referenced by every page's `og:image` |
| `brand/` | Logo and banner source files (PNG and HTML), not linked from any page. The HTML and PNG files are git-ignored, and `.htaccess` returns 404 for anything under `/brand/` |
| `.htaccess`, `robots.txt`, `sitemap.xml` | Server and search engine files. `.htaccess` forces HTTPS and the bare domain, serves `404.html`, and blocks `.git`, `brand/` and `.md` files from being served |
| The two LinkedIn markdown files in the root | Working notes, kept by instruction, not linked from the site |

Links: only `404.html` uses root-relative paths (`/styles.css`, `/index.html`), because `.htaccess` serves it from any URL. Every other page links relatively, so each one opens correctly from the site root, including as a local file.

The site names no individual.

Forms: set `FORM_KEY` in `script.js` to a Web3Forms access key to send submissions to hello@aelvyn.com in the background. Until then the visitor's email client opens with the details filled in.

To preview locally, open `index.html` in a browser.
