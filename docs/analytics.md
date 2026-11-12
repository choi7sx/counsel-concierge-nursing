# Google Analytics 4

The shared `Counsel` layout includes GA4 on every page, including the noindex QR-code pages (`/reviews`, `/post-op-investment-guide`), the form receipt pages, and the 404 page. It follows the same setup as the Excel Sports Performance site. Delegated listeners cover links, buttons, FAQ accordions, the navigation menus, and the consultation dialog. Ordinary text and form fields don't produce events.

## The property

The site uses the practice's existing GA4 web stream, Measurement ID **`G-VNLPGMFKCT`**. The Squarespace site sent data to it through Squarespace's built-in Google Analytics integration, so reporting continues in the same property after the move to CloudCannon. The ID is set in `src/components/Analytics.astro`. A Measurement ID is public, not a password or API secret.

1. Deploy the production build to activate tracking. No CloudCannon environment change is needed. To use a different property, set `PUBLIC_GA_MEASUREMENT_ID` in CloudCannon's build environment and rebuild. An explicitly empty value turns tracking off. `.env.example` documents the override.
2. Tracking is off in `astro dev` and on any hostname other than `counselconciergenursing.com` or `www.counselconciergenursing.com`. Local previews and the CloudCannon preview domain (`composed-dove.cloudvent.net`) don't send data to production analytics.
3. Don't install a second Google tag, for example through Google Tag Manager or a CloudCannon snippet. Once the Squarespace website plan is cancelled, its copy of the tag stops on its own.
4. In GA4, open **Admin → Data streams → (web stream) → Enhanced measurement → Page views → Show advanced settings** and turn off **Page changes based on browser history events**. Opening the consultation dialog adds `#consultation-request` to the address so the Back button closes it. With that setting on, GA4 may count each open and close as an extra page view. This is a multi-page site, so that setting isn't needed for anything else.
5. Optionally add `counselconciergenursing.com` under **Admin → Data streams → Configure tag settings → List unwanted referrals** if `portal.counselconciergenursing.com` sends visitors back and splits their sessions.

**Done on November 12, 2026:** the property (account "Compass Concierge Nursing", property "1 Compass Ct", stream `G-VNLPGMFKCT`) was shared with Devotion Creative. Browser-history page views were turned off (step 4 above). `generate_lead` was created as a key event with no default value, counted once per event. The six custom dimensions under "Reports and validation" were created. What remains is the live check in step 1 of that section, after this code is deployed.

## Events

| Event | Meaning |
| --- | --- |
| `consultation_click` | Activate a Request Private Consultation link (opens the dialog) |
| `consultation_close` | Activate the consultation dialog's close button |
| `generate_lead` | A consultation request was accepted by CloudCannon's form service |
| `application_submit` | A Work With Us application was accepted by CloudCannon's form service |
| `phone_click` | Activate a phone link (doesn't confirm a connected call) |
| `email_click` | Activate an email link (doesn't confirm a sent email) |
| `portal_click` | Open the Client Portal |
| `reviews_click` | Open a review site from `/reviews` |
| `social_click` | Open Instagram, Facebook, or LinkedIn |
| `faq_toggle` | Open or close an FAQ |
| `menu_toggle` | Open or close the mobile menu or the Services menu |
| `navigation_click` | Follow a header, footer, or navigation link |
| `internal_link_click` | Follow another internal link, including service and article cards |
| `external_link_click` | Follow another external link |
| `download_click` | Activate a link with the `download` attribute |
| `button_click` | Activate another button, including form submit buttons |

Click events include `click_text`, `click_location`, and `page_path`. Link events also include `link_destination` (query and fragment removed, up to 100 characters). Phone and email destinations contain only `tel:` or `mailto:`, and their `click_text` is a generic "Call Counsel" or "Email Counsel". Toggles include the intended `click_action` (`open` or `close`). `generate_lead` and `application_submit` include `form_name`, `click_location` (`consultation-dialog` or the page section), and `page_path`.

`generate_lead` and `application_submit` fire only after the form script confirms CloudCannon accepted the submission (`counsel:form-sent` in `src/scripts/consultation.ts`). **Only the form's name is sent. Names, contact details, messages, and resumes never reach analytics.** A visitor without JavaScript lands on the receipt page instead (`/consultation-request-received/`, `/application-received/`); its page view counts the submission.

Page URLs keep only campaign parameters (`utm_*`, `gclid`, `dclid`, `gbraid`, `wbraid`). Other query parameters and fragments are removed, and so are referrer query strings. Google signals and ad personalization are off. This setup doesn't include a consent banner. Because this is a health-related practice, keep event labels generic: never send a visitor's condition, a form field, or free text.

Keyboard activation, nested icons, modified clicks, and middle clicks are supported. Each activation produces one event. Tracking never cancels or delays navigation, dialing, or form submission. Enhanced measurement may also send its own generic outbound `click` events. Use the named events above in reports rather than adding the two counts together.

## Reports and validation

1. After deployment, open the live site with GA4's **Reports → Realtime** (or **Admin → DebugView**) open. Click the navigation, an FAQ, Request Private Consultation, and the dialog's close button, and confirm the named events arrive. Ad blockers can prevent collection. To check `generate_lead`, send one real test consultation request and confirm both the event and the email.
2. Mark `generate_lead` as a **key event** (Admin → Events). Optionally also mark `application_submit`, `phone_click`, and `email_click`. Phone and email clicks represent intent, not connected calls or sent emails.
3. Under **Admin → Custom definitions**, create event-scoped custom dimensions for `click_text`, `click_location`, `page_path`, `link_destination`, `click_action`, and `form_name`. Processing can take 24–48 hours.
4. In **Explore**, build a funnel: page view → `consultation_click` → `generate_lead`. Break it down by page path and session source/medium to see which pages and channels produce consultation requests. Use the standard Pages and screens and Traffic acquisition reports for overall traffic.

New components are covered automatically when they use standard links, buttons, or `<summary>` elements. `data-analytics-section` overrides the placement, `data-analytics-label` overrides a label, and `data-analytics-ignore` opts an element and its children out. Use only static, non-personal labels. A new site form needs a `data-analytics-form` name and a matching entry in `formEvents` in `src/lib/analytics.ts`.

Run `npm test` to build the site and check tracking on every built page. The tests use a local DOM with Google's script disabled, so they don't send events to Google. Verify live collection separately after deployment.

References: [Google event setup](https://developers.google.com/analytics/devguides/collection/ga4/events), [recommended events (`generate_lead`)](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead), [event parameters and custom dimensions](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters).
