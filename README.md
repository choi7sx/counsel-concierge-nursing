# Counsel Concierge Nursing

A responsive Astro website for a private nursing practice in Nashville and Middle Tennessee. The design uses warm ivory, muted olive, large editorial headings, and the client's existing photography.

## Development

```sh
npm ci
npm run dev
```

Open http://localhost:4321. Use `npm run build` to generate the static site in `dist/`, and `npm run preview` to inspect the production build.

## Content and routes

`data/counsel-content.json` contains the client's original page writing, service descriptions, FAQs, legal policies, and four complete Insights articles. The migration preserves the original public URL paths. `/approach` presents the existing Discover, Consult, Design, and Care process as a dedicated page. `/home` and `/store` remain accessible, with canonical links to the homepage and services page respectively.

`src/lib/counsel.ts` assembles the content used by page templates. `src/pages/[...slug].astro` generates the public pages. Design components live in `src/components/counsel/`, the shared layout in `src/layouts/Counsel.astro`, and responsive styling in `src/styles/counsel.css`.

The CloudCannon data editor is configured for the migrated content file. Existing page blocks have a deliberate order used by the templates; edit their writing without reordering blocks. An Insights article is a page entry with a path under `/insights/`, a title, description, ISO date, author, category, image path, excerpt, and HTML content blocks. New article entries automatically appear in the journal and sitemap. Source HTML is trusted editorial content and must not contain executable scripts or untrusted embeds.

## Contact and portal

Client Portal links open `https://portal.counselconciergenursing.com` in a new tab. Portal authentication remains with the existing provider.

Consultation, general inquiry, and careers pages link to the client's existing forms on their permanent Squarespace hostname, with each original form's anchor. There is no new form submission backend and no simulated successful submissions. These hosted forms need to remain available until a replacement form integration is configured. Phone and email links also work directly.

The old $0 product checkout presentation has been replaced with consultation-oriented service detail pages. The original post-operative starting price of $750 remains on the recovery care page.

## Assets and metadata

Client photography is stored locally as responsive WebP images in `public/images/counsel/`. `data/counsel-images.json` records original source URLs, dimensions, and available sizes; `node scripts/prepare-counsel-images.mjs` rebuilds these assets without upscaling. Some original photographs have limited resolution, so larger photographer originals are needed for sharper large-screen heroes. Fonts are self-hosted, with license files in `public/fonts/`. The site includes canonical URLs, Open Graph metadata, `sitemap.xml`, and `robots.txt`.

## Typography, spacing, and shape

`src/styles/counsel-system.css` is the final design layer, imported after the component layouts in `counsel.css`. It adapts the [Parloa reference](https://styles.refero.design/style/c90e63f8-76c1-4159-9460-29e0d18751ae) while retaining Counsel's existing colors, photography, and scrolling hero treatment.

- Headings use self-hosted Fraunces, the user-approved substitute for the reference's commercial Exposure30. Exposure30 is not included. Body text and controls use self-hosted Geist. Both bundled font families have SIL Open Font License files in `public/fonts/`.
- Display headings use weight 350; smaller headings use 400. Use the shared type tokens, with upright editorial headings, 16px body text, and 18px article text and introductions. Counsel's wordmark retains its original font.
- Use the 4px spacing scale: 16px element gaps, 24px card padding, 80px desktop sections, and a 1200px content container. Mobile sections reduce to 48px. Long articles keep a narrower reading column.
- Cards use 8px corners and 1px borders; controls use 6px corners and at least 44px touch targets. Scrolling content panels have larger rounded corners (32px desktop, 24px mobile). Preserve the glass navigation and reduced-motion behavior. The Insights index uses an image-free editorial header with dark navigation on cream.
- The navigation follows Parloa's live homepage proportions: a 64px bar and compact CTA (36px visible height with an extended 44px click area; 44px on touch devices). The homepage headline is 54px at a 1440px viewport, with the description directly below and one consultation CTA. This intentionally overrides the earlier reference's larger display scale.
- Reuse the tokens in this stylesheet for new UI rather than adding one-off type sizes or spacing overrides. Font assets are local; the site makes no runtime requests to a font CDN.

## Review notes

The client's writing and seven monthly retainer services are retained, with approved editorial cleanup for duplicate text, inconsistent naming, spelling, and selected clinical guidance. The original Terms describe care as "non-skilled" while the service pages describe clinical nursing oversight; the client should reconcile that wording before launch.

No changes have been published to the existing website. The site's production hostname is configured for future deployment; development remains local.
