# Counsel Concierge Nursing

A responsive Astro website for a private nursing practice in Nashville and Middle Tennessee. The design uses deep navy, champagne accents, warm ivory, large editorial headings, and the client's existing photography.

## Development

```sh
npm ci
npm run dev
```

Open http://localhost:4321. Use `npm run build` to generate the static site in `dist/`, and `npm run preview` to inspect the production build.

## Content and routes

`data/counsel-content.json` contains the client's original page writing, service descriptions, FAQs, legal policies, and four complete Insights articles. Original public URL paths are preserved, except the retired `/store` pages, which `.cloudcannon/routing.json` redirects to their replacements. `/approach` presents the existing Discover, Consult, Design, and Care process as a dedicated page. `/home` remains accessible, with a canonical link to the homepage.

`src/lib/counsel.ts` assembles the content used by page templates. `src/pages/[...slug].astro` generates the public pages. Design components live in `src/components/counsel/`, the shared layout in `src/layouts/Counsel.astro`, and responsive styling in `src/styles/counsel.css`.

Services come in two types. The Services page entry holds both catalogs: Monthly Retainer Services (block 4) and Situational Services (block 8), plus longer copy for Travel (block 6) and Hospital & Home Health Transitions (block 7). A service offered both ways is listed in both catalogs under the same title and keeps one URL, `/services/<slug>`, which explains both options; never create a second page for it. Post-Op Recovery Care stays at `/post-operative-care-nashville`, because it is the most requested service and that URL is established. The Services menu and homepage share the three service types in `serviceTypes` (`src/lib/counsel.ts`): Post-Op Recovery Care, plus Monthly Retainer Services and Situational Services, which link to their sections on the Services page. The homepage cards also list each service by name. The footer lists every service page so each stays linked site-wide.

`/reviews` and `/post-op-investment-guide` are reached by printed QR codes. Never change those paths: printed codes cannot be updated. Both pages are hidden from search engines and the sitemap with `noindex`, and the menu does not link to them. Post-op prices are editable in CloudCannon as `pricing` blocks on the investment guide entry. Its testimonial button opens an email to `info@counselconciergenursing.com`. Work With Us is linked in the footer.

The CloudCannon data editor is configured for the migrated content file. Existing page blocks have a deliberate order used by the templates; edit their writing without reordering blocks. An Insights article is a page entry with a path under `/insights/`, a title, description, ISO date, author, category, image path, excerpt, and HTML content blocks. New article entries automatically appear in the journal and sitemap. Source HTML is trusted editorial content and must not contain executable scripts or untrusted embeds.

## Contact and portal

Client Portal links open `https://portal.counselconciergenursing.com` in a new tab. Portal authentication remains with the existing provider.

Consultation CTAs open a shared native dialog, which becomes a full-screen form on phones. The permanent consultation URL also includes the form inline. The form matches the original fields: first and last name, phone, email, optional location, relationship (Self, Family Member, Other), and an optional message. Draft values remain in the page when the dialog is closed; they are not written to browser storage. Escape, the close button, and browser Back dismiss the dialog.

The consultation form is the site's only form. It uses [CloudCannon's hosted form service](https://cloudcannon.com/documentation/developer-articles/connecting-your-site-to-an-inbox/) and does not depend on the old Squarespace site. It posts URL-encoded fields to `/consultation-request-received/`, using `inbox_key` for routing, `_replyto` for the visitor's email, `_subject` for the notification subject, and `_gotcha` for spam filtering. The recipient is configured in CloudCannon rather than supplied by the browser. JavaScript keeps visitors in the dialog and displays confirmation; without JavaScript, the configured form navigates to the receipt page. No submission data goes into a URL or browser storage. The receipt page is excluded from the sitemap and marked noindex.

Contact and Work With Us have no forms. Contact shows the phone and email card below its copy. Work With Us uses `DirectContact.astro`: an email button, which opens the visitor's mail app with the subject pre-filled, and a call button. The site never receives or stores files.

**Prepared for client review; live activation is intentionally deferred.** Leave `PUBLIC_CLOUDCANNON_INBOX_KEY` blank until the client decides to proceed. The form integration is implemented, but no CloudCannon Inbox, email target, or domain change has been activated from this workspace.

When the client proceeds, complete this connection checklist:

1. In CloudCannon Organization Settings → Hosting → Forms, create an Inbox for consultation requests. Under Manage → Add new target, choose Email and set `info@counselconciergenursing.com` as the target. Turn off Accept file uploads, since no form sends files.
2. Open the validation link sent to that email address. [CloudCannon requires this verification before forwarding submissions](https://cloudcannon.com/documentation/developer-articles/integrating-your-forms-with-email/).
3. In this site's Settings → Hosting → Forms, link that Inbox. Copy its exact key into the site's build environment variable `PUBLIC_CLOUDCANNON_INBOX_KEY`, then rebuild. This is a public routing key, not an email password or API secret. Do not require CAPTCHA unless its matching widget is also added to the form; the current form uses CloudCannon's honeypot.
4. On the CloudCannon-hosted HTTPS preview, submit an identifiable test request. Confirm it appears in the CloudCannon Inbox and arrives at `info@counselconciergenursing.com`, and that Reply addresses the visitor. Verify failure handling before connecting the production domain.

An unset Inbox key, development build, or local/HTTP preview does not send requests. Failed submissions preserve the visitor's entries and offer direct email/phone contact. CloudCannon's HTTP 200 response must contain our receipt page marker before the client shows confirmation. Confirmation means the hosting service accepted the submission; delivery to the email inbox requires the live check above. Browser tests intercept responses and do not send email.

Phone and email links work directly.

### Connect the Squarespace domain to CloudCannon

The domain can remain registered with Squarespace, and the existing mailbox can remain with its current email provider. A registrar transfer is not needed to change website hosting.

Current CloudCannon preview: https://composed-dove.cloudvent.net/. Deploy this branch's changes there before activating the Inbox key; the preview checked on October 12, 2026 still contained the earlier site without the consultation dialog.

1. Add `counselconciergenursing.com` and the `www` hostname to the CloudCannon production site's domain configuration. Select external DNS and use the exact A/CNAME records shown by CloudCannon; do not guess IP addresses.
2. Save a copy of the current Squarespace DNS records. Update only the website records CloudCannon specifies in Squarespace's domain DNS settings. Preserve MX records, email-related TXT/CNAME records (including SPF, DKIM, and DMARC), and the separate client portal hostname. Keep Squarespace nameservers when using external DNS.
3. Confirm CloudCannon's domain verification and HTTPS certificate, check both root and `www` domains and their redirects, then repeat the live consultation form test and check that existing mailbox sending/receiving still works.
4. Keep the domain registration and email subscriptions active. Once the domain points to CloudCannon, the old Squarespace website is no longer used and can be cancelled; keep only the domain registration.

References: [CloudCannon external DNS](https://cloudcannon.com/documentation/developer-articles/configure-external-dns/) and [pointing a Squarespace domain to another host](https://support.squarespace.com/hc/en-us/articles/215744668-Pointing-a-Squarespace-domain). DNS and email target settings are account-level changes and are not applied by this repository.

The old $0 product checkout pages have been replaced with consultation-oriented service pages. The original post-operative starting price of $750 remains on the recovery care page.

## Assets and metadata

Client photography is stored locally as responsive WebP images in `public/images/counsel/`. `data/counsel-images.json` records original source URLs, dimensions, and available sizes; `node scripts/prepare-counsel-images.mjs` rebuilds these assets without upscaling. Some original photographs have limited resolution, so larger photographer originals are needed for sharper large-screen heroes. Fonts are self-hosted, with license files in `public/fonts/`. `node scripts/prepare-share-assets.mjs` rebuilds the 1200×630 share images in `public/images/og/` and the favicon set from `public/favicon.svg`.

## Search engines and AI assistants

Search metadata lives in `src/layouts/Counsel.astro` and `src/lib/seo.ts`, and is built from the page content, so edits in CloudCannon update it automatically.

- Every page has a title, description, canonical URL (no trailing slash, matching the original Squarespace URLs), Open Graph and Twitter cards with a 1200×630 JPEG, and favicons. In CloudCannon, `metaTitle` sets an optional search title; the practice name is appended unless the title already includes it. Keep descriptions around 150–160 characters.
- Indexable pages include schema.org JSON-LD: the practice as a concierge nursing practice (`LocalBusiness`, since schema.org has no nursing-practice type; `MedicalBusiness` would class it with clinics) with phone, email, Nashville / Middle Tennessee service area, and social profiles; its founder as a `Person` with BSN and RN credentials, `BreadcrumbList`s, a `Service` for each service page (post-op care includes its $750 starting price), `FAQPage` for the FAQ accordions on the Services and Post-Op pages, and `BlogPosting` for Insights articles. A page's FAQ markup comes from the accordion that follows a "Frequently Asked Questions" heading.
- `/llms.txt` summarizes the practice, services, articles, and FAQs in plain text for AI assistants ([llmstxt.org](https://llmstxt.org)). `/insights/rss.xml` lists the articles. `/sitemap.xml` lists indexable pages, with article dates as `lastmod`.
- `robots.txt` allows all crawlers, including AI search and assistant crawlers. The current Squarespace site blocks them (Squarespace's AI-crawler setting), so ChatGPT, Claude, Perplexity, and Gemini cannot currently read or cite the practice's pages. Pages marked `noindex` stay crawlable so search engines can see the tag.
- The CloudCannon preview domain (`*.cloudvent.net`) sends `X-Robots-Tag: noindex`, which is expected for a preview. After connecting the domain, confirm production responses do not: `curl -sI https://counselconciergenursing.com/ | grep -i x-robots` should print nothing.

After the domain points to CloudCannon, complete these account-level steps. They cannot be done from this repository:

1. **Google Search Console.** Add a Domain property for `counselconciergenursing.com` and verify it with the DNS TXT record Google provides, added in Squarespace's DNS settings alongside the existing records. Submit `https://counselconciergenursing.com/sitemap.xml`, then use URL Inspection → Request indexing for the homepage, Services, and Post-Op pages. If the Squarespace site was already verified, keep the property; its history carries over. If DNS isn't an option, set `PUBLIC_GOOGLE_SITE_VERIFICATION` to the HTML tag's `content` value in CloudCannon's build environment and rebuild.
2. **Bing Webmaster Tools.** Choose Import from Google Search Console, or verify separately (`PUBLIC_BING_SITE_VERIFICATION` for the tag method), and submit the sitemap. Bing's index also feeds Copilot and DuckDuckGo and is one of the sources for ChatGPT search.
3. **Google Business Profile.** Claim or create the profile as a service-area business (Nashville and surrounding Middle Tennessee, hiding any street address), category *Nursing agency* or the closest match, with the same name, phone `(615) 933-9208`, and website as the site. This drives map and "near me" results more than anything on the website. Ask clients for reviews there; `/reviews` already links to Google. Use the same name, phone, and site on Apple Business Connect, Yelp, Facebook, and Nextdoor.
4. **After launch.** Two weeks after switching, check Search Console → Pages for 404s from old URLs and add any to `.cloudcannon/routing.json` as 301 redirects. Test a few pages in [Google's Rich Results Test](https://search.google.com/test/rich-results).

## Typography, spacing, and shape

`src/styles/counsel-system.css` is the final design layer, imported after the component layouts in `counsel.css`. It adapts the [Parloa reference](https://styles.refero.design/style/c90e63f8-76c1-4159-9460-29e0d18751ae) while retaining Counsel's existing colors, photography, and scrolling hero treatment.

- The site uses Counsel's social media fonts. Headings use self-hosted EB Garamond, the open-source web cut of Garamond. Body text and controls use self-hosted Montserrat. Both families have SIL Open Font License files in `public/fonts/`.
- Headings use weight 400. Use the shared type tokens, with upright editorial headings, 16px body text, and 17px article text and introductions. Garamond sets small and Montserrat sets wide, so keep the larger heading tokens and zero text tracking. Counsel's wordmark retains its original font.
- Use the 4px spacing scale: 16px element gaps, 24px card padding, 80px desktop sections, and a 1200px content container. Mobile sections reduce to 48px. Long articles keep a narrower reading column.
- Cards use 8px corners and 1px borders; controls use 6px corners and at least 44px touch targets. Scrolling content panels have larger rounded corners (32px desktop, 24px mobile). Preserve the glass navigation and reduced-motion behavior. The Insights index uses an image-free editorial header with dark navigation on cream.
- The navigation follows Parloa's live homepage proportions: a 64px bar and compact CTA (36px visible height with an extended 44px click area; 44px on touch devices). The homepage headline is 54px at a 1440px viewport, with the description directly below and one consultation CTA. This intentionally overrides the earlier reference's larger display scale.
- Reuse the tokens in this stylesheet for new UI rather than adding one-off type sizes or spacing overrides. Font assets are local; the site makes no runtime requests to a font CDN.
- Color tokens live in `counsel.css`: primary navy `#0A2139`, champagne accent `#D6B98C`, ivory `#F7F5F0`, and blue-gray mist `#EAF0F5`. Use the dark bronze accent `#795B36` for accent text on light surfaces; use champagne on navy. Navigation, photo overlays, buttons, borders, and scope cards share this palette.
- Mobile layouts support 320px viewports with wrapping hero titles, single-column approach cards below 600px, and 44px minimum standalone navigation/contact targets. Clinical card icons stay in normal flow to avoid heading overlap. The mobile menu scrolls independently in short/landscape viewports, locks background scrolling and focus, and restores the page on close or desktop resize. These choices follow W3C guidance for [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [touch targets](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).

## Review notes

The client's writing and seven monthly retainer services are retained, alongside four situational services, with approved editorial cleanup for duplicate text, inconsistent naming, spelling, and selected clinical guidance. The original Terms describe care as "non-skilled" while the service pages describe clinical nursing oversight; the client should reconcile that wording before launch.

No changes have been published to the existing website. The site's production hostname is configured for future deployment; development remains local.
