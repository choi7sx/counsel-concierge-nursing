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

The consultation form uses [CloudCannon's hosted form service](https://cloudcannon.com/documentation/developer-articles/connecting-your-site-to-an-inbox/) and does not depend on the old Squarespace site. It posts URL-encoded fields to `/consultation-request-received/`, using `inbox_key` for routing, `_replyto` for the visitor's email, `_subject` for the notification subject, and `_gotcha` for spam filtering. The recipient is configured in CloudCannon rather than supplied by the browser. JavaScript keeps visitors in the dialog and displays confirmation; without JavaScript, the configured form navigates to the receipt page. No submission data goes into a URL or browser storage. The receipt page is excluded from the sitemap and marked noindex.

The Work With Us application (`CareerForm.astro`) matches the original site's fields: first and last name, email, phone, title (Registered Nurse, Licensed Practical Nurse, Certified Nursing Assistant/Caregiver, Other), years of experience, an optional note, and a required resume/CV (PDF or Word, up to CloudCannon's 5MB limit per file). It uses the same Inbox key and submit script as the consultation form, but sends a multipart upload to `/application-received/`, its own noindex receipt page, with a separate `_subject` so applications are easy to tell apart. Contact has no form; it shows the phone and email card below its copy.

**The consultation form is live.** It was connected on November 11, 2026:

- CloudCannon Inbox **Consultation Requests**, key `counsel-consultations`, linked to this site under Site Settings → Hosting → Forms. Display inbox is on and Require CAPTCHA is off, since the form uses CloudCannon's honeypot. Don't turn CAPTCHA on unless its widget is added to the form too.
- Email target: `gus@counselconciergenursing.com` (validated). Manage targets under Organization Settings → Hosting → Forms → Manage. A target forwards nothing until its recipient clicks the validation link CloudCannon emails. `info@counselconciergenursing.com` never received that email, so it isn't a working target.
- Build environment variable `PUBLIC_CLOUDCANNON_INBOX_KEY=counsel-consultations`, under Site Settings → Builds → Configuration. It's a public routing key, not a secret. The form reads it at build time, so changing it needs a rebuild. To check the live value, look for `name="inbox_key" value="counsel-consultations"` in the consultation page's HTML.
- Work With Us applications use the same Inbox and key. Accept file uploads must be on for this Inbox (Organization Settings → Hosting → Forms), or resumes are not delivered. Once enabled, send a test application with a resume and confirm it reaches the email target with the file attached.

An unset Inbox key, development build, or local/HTTP preview does not send requests. Failed submissions preserve the visitor's entries and offer direct email/phone contact. CloudCannon's HTTP 200 response must contain our receipt page marker before the client shows confirmation. Confirmation means the hosting service accepted the submission; delivery to the email inbox requires the live check above. Browser tests intercept responses and do not send email.

Phone and email links work directly.

### Domain and hosting

`counselconciergenursing.com` has been served by CloudCannon since November 11, 2026. The domain is still registered at Squarespace, and its DNS stays there. Email stays on Google Workspace, and `portal.` stays on Google's hosting. The preview address is https://composed-dove.cloudvent.net/.

The setup below is the one that works with Squarespace DNS. It's the same as the client's other sites (Excel Sports Performance, Devotion Creative). Attaching `www` to CloudCannon instead leaves SSL stuck on "Setup pending."

- **CloudCannon:** the custom domain `counselconciergenursing.com` uses External DNS and is attached to this site with an **empty Subdomain**, so the site is served at the root domain. Under Custom Domain → HTTPS, CloudCannon issues and renews the certificate and redirects `http://` to `https://`. Ignore the "Other subdomains: Action needed" wildcard-certificate warning. It applies only to subdomains that aren't set up, and wildcard certificates aren't available with external DNS.
- **Squarespace DNS:** the "Squarespace Defaults" preset was deleted. Two custom records were added: `A @ 52.8.178.132` and `A @ 184.169.135.34`. There's deliberately no `www → sites.cloudcannon.com` CNAME, because with external DNS, CloudCannon's certificate covers only the root domain. Don't click Squarespace's "Update DNS records" banner, which would restore the old defaults.
- **`www`:** under Squarespace → Domains → Website → Domain Forwarding Rules, `www` forwards to `https://counselconciergenursing.com` with a 301 redirect and paths kept. Squarespace manages `www`'s DNS record and certificate for this.
- **Leave unchanged:** MX `smtp.google.com`; the `google._domainkey`, `_dmarc`, `send`, `mail`, and `resend._domainkey` records and the three CNAMEs with long random names (email sending); the `google-site-verification` TXT records; `portal`; and `_domainconnect`.
- **Known DNS issue:** the Google Workspace SPF TXT record (`v=spf1 include:_spf.google.com ~all`) has the full domain typed as its Name. Squarespace appends the domain automatically, so the record is published at `counselconciergenursing.com.counselconciergenursing.com`. Change its Name to `@`.

After the switch, devices could keep showing the old Squarespace site for up to the 4-hour TTL. Home routers can cache the old records too. Verify the live site independently of local caches with `curl --resolve counselconciergenursing.com:443:52.8.178.132 https://counselconciergenursing.com/`. Cancel the Squarespace *website* plan once everything is confirmed, but keep the domain registration and Google Workspace.

References: [CloudCannon external DNS](https://cloudcannon.com/documentation/developer-articles/configure-external-dns/) and [Squarespace domain forwarding](https://support.squarespace.com/hc/en-us/articles/214767107-Forwarding-a-domain).

The old $0 product checkout pages have been replaced with consultation-oriented service pages. The original post-operative starting price of $750 remains on the recovery care page.

## Assets and metadata

Client photography is stored locally as responsive WebP images in `public/images/counsel/`. `data/counsel-images.json` records original source URLs, dimensions, and available sizes; `node scripts/prepare-counsel-images.mjs` rebuilds these assets without upscaling. Some original photographs have limited resolution, so larger photographer originals are needed for sharper large-screen heroes. Fonts are self-hosted, with license files in `public/fonts/`. `node scripts/prepare-share-assets.mjs` rebuilds the 1200×630 share images in `public/images/og/` and the favicon set from `public/favicon.svg`.

## Search engines and AI assistants

Search metadata lives in `src/layouts/Counsel.astro` and `src/lib/seo.ts`, and is built from the page content, so edits in CloudCannon update it automatically.

- Every page has a title, description, canonical URL (no trailing slash, matching the original Squarespace URLs), Open Graph and Twitter cards with a 1200×630 JPEG, and favicons. In CloudCannon, `metaTitle` sets an optional search title; the practice name is appended unless the title already includes it. Keep descriptions around 150–160 characters.
- Indexable pages include schema.org JSON-LD: the practice as a concierge nursing practice (`LocalBusiness`, since schema.org has no nursing-practice type; `MedicalBusiness` would class it with clinics) with phone, email, Nashville / Middle Tennessee service area, and social profiles; its founder as a `Person` with BSN and RN credentials, `BreadcrumbList`s, a `Service` for each service page (post-op care includes its $750 starting price), `FAQPage` for the FAQ accordions on the Services and Post-Op pages, and `BlogPosting` for Insights articles. A page's FAQ markup comes from the accordion that follows a "Frequently Asked Questions" heading.
- `/llms.txt` summarizes the practice, services, articles, and FAQs in plain text for AI assistants ([llmstxt.org](https://llmstxt.org)). `/insights/rss.xml` lists the articles. `/sitemap.xml` lists indexable pages, with article dates as `lastmod`.
- `robots.txt` allows all crawlers, including AI search and assistant crawlers. The old Squarespace site blocked them with Squarespace's AI-crawler setting. Pages marked `noindex` stay crawlable so search engines can see the tag.
- The CloudCannon preview domain (`*.cloudvent.net`) sends `X-Robots-Tag: noindex` and a blocking `robots.txt`, as previews should. The production domain sends neither (confirmed November 11, 2026).

Complete these account-level steps now that the domain points to CloudCannon. They can't be done from this repository:

1. **Google Search Console.** The domain already has two `google-site-verification` TXT records, so a property probably exists; if not, add a Domain property for `counselconciergenursing.com` and verify it with the DNS TXT record Google provides, added in Squarespace's DNS settings alongside the existing records. Submit `https://counselconciergenursing.com/sitemap.xml`, then use URL Inspection → Request indexing for the homepage, Services, and Post-Op pages. If the Squarespace site was already verified, keep the property; its history carries over. If DNS isn't an option, set `PUBLIC_GOOGLE_SITE_VERIFICATION` to the HTML tag's `content` value in CloudCannon's build environment and rebuild.
2. **Bing Webmaster Tools.** Choose Import from Google Search Console, or verify separately (`PUBLIC_BING_SITE_VERIFICATION` for the tag method), and submit the sitemap. Bing's index also feeds Copilot and DuckDuckGo and is one of the sources for ChatGPT search.
3. **Google Business Profile.** Claim or create the profile as a service-area business (Nashville and surrounding Middle Tennessee, hiding any street address), category *Nursing agency* or the closest match, with the same name, phone `(615) 933-9208`, and website as the site. This drives map and "near me" results more than anything on the website. Ask clients for reviews there; `/reviews` already links to Google. Use the same name, phone, and site on Apple Business Connect, Yelp, Facebook, and Nextdoor.
4. **After launch.** Two weeks after switching, check Search Console → Pages for 404s from old URLs and add any to `.cloudcannon/routing.json` as 301 redirects. Test a few pages in [Google's Rich Results Test](https://search.google.com/test/rich-results).

## Analytics

GA4 is wired into the shared layout on every page. It uses the practice's existing Measurement ID, `G-VNLPGMFKCT`, which the Squarespace site also used, so reporting history continues. Tracking runs only on `counselconciergenursing.com`, not in development or on the CloudCannon preview domain. `PUBLIC_GA_MEASUREMENT_ID` can override the ID, or turn tracking off with an empty value. Named events cover consultation, phone, email, portal, and review clicks. Confirmed consultation requests send `generate_lead`, and confirmed applications send `application_submit`. Form contents are never sent. One GA4 admin setting must be changed so the consultation dialog isn't counted as extra page views. See [the analytics setup and reporting guide](docs/analytics.md).

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

The site went live at https://counselconciergenursing.com on November 11, 2026. Merges to `main` deploy automatically through CloudCannon.
