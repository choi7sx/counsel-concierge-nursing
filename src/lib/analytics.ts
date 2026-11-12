// GA4 for counselconciergenursing.com. Ported from the Excel Sports Performance site:
// delegated click tracking, plus confirmed consultation and application submissions.
const clickableSelector = 'a[href], button, summary, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]';
const productionHosts = new Set(["counselconciergenursing.com", "www.counselconciergenursing.com"]);
const consultationPath = "/private-nursing-consultation-nashville";
const socialHosts = /(^|\.)(instagram\.com|facebook\.com|linkedin\.com)$/;
// Sent by src/scripts/consultation.ts once CloudCannon confirms a submission.
export const formSentEvent = "counsel:form-sent";
const formEvents: Record<string, string> = { consultation: "generate_lead", application: "application_submit" };

type Parameters = Record<string, string | number | boolean>;
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  counselAnalyticsInitialized?: boolean;
};

export function canTrack(measurementId: string, hostname: string) {
  return /^G-[A-Z0-9]+$/.test(measurementId) && productionHosts.has(hostname);
}

// Preserve campaign attribution, but don't forward arbitrary query parameters.
export function analyticsPageUrl(value: string) {
  const url = new URL(value);
  const allowed = /^(utm_(source|medium|campaign|id|term|content|source_platform)|gclid|dclid|gbraid|wbraid)$/;
  for (const key of [...url.searchParams.keys()]) {
    if (!allowed.test(key)) url.searchParams.delete(key);
  }
  url.hash = "";
  return url.href;
}

function destination(href: string, base: string) {
  const url = new URL(href, base);
  // Record the contact method without sending an email address or phone number.
  if (url.protocol === "tel:" || url.protocol === "mailto:") return url.protocol;
  if (!["https:", "http:"].includes(url.protocol)) return "";
  return `${url.origin}${url.pathname}`.slice(0, 100);
}

function placement(element: Element) {
  const section = element.closest("[data-analytics-section], dialog, header, footer, nav, section, article, main");
  return (section?.getAttribute("data-analytics-section") || section?.id ||
    section?.getAttribute("aria-labelledby") || section?.getAttribute("aria-label") ||
    section?.tagName.toLowerCase() || "page").slice(0, 100);
}

export function clickEvent(element: Element, pageUrl: string) {
  const href = element.getAttribute("href");
  const url = href === null ? null : new URL(href, pageUrl);
  const page = new URL(pageUrl);
  let name = "button_click";
  if (url?.origin === page.origin && url.pathname.replace(/\/$/, "") === consultationPath) name = "consultation_click";
  else if (url?.protocol === "tel:") name = "phone_click";
  else if (url?.protocol === "mailto:") name = "email_click";
  else if (url?.hostname === "portal.counselconciergenursing.com") name = "portal_click";
  else if (element.closest(".review-links")) name = "reviews_click";
  else if (url && socialHosts.test(url.hostname)) name = "social_click";
  else if (element.matches("[data-close-consultation]")) name = "consultation_close";
  else if (element.matches(".menu-toggle, .services-nav > summary")) name = "menu_toggle";
  else if (element.matches("summary")) name = "faq_toggle";
  else if (element.hasAttribute("download")) name = "download_click";
  else if (url && url.origin !== page.origin) name = "external_link_click";
  else if (url) name = element.closest("nav, header, footer") ? "navigation_click" : "internal_link_click";

  const labelledBy = element.getAttribute("aria-labelledby")?.split(/\s+/)
    .map(id => element.ownerDocument.getElementById(id)?.textContent || "").join(" ");
  const clean = (value: string | null | undefined) => value?.replace(/\s+/g, " ").trim() || "";
  // Image-only links (such as article card photos) fall back to their path.
  const text = name === "phone_click" ? "Call Counsel" : name === "email_click" ? "Email Counsel" :
    clean(element.getAttribute("data-analytics-label")) || clean(labelledBy) || clean(element.getAttribute("aria-label")) ||
    clean(element.textContent) || clean(element.querySelector("img")?.getAttribute("alt")) ||
    (url?.origin === page.origin ? url.pathname : "") || element.tagName.toLowerCase();
  const parameters: Parameters = {
    click_text: text.slice(0, 100),
    click_location: placement(element),
    page_path: page.pathname,
  };
  if (href !== null) parameters.link_destination = destination(href, pageUrl);
  const details = element.matches("summary") ? element.closest("details") : null;
  if (details) parameters.click_action = details.hasAttribute("open") ? "close" : "open";
  else if (element.hasAttribute("aria-expanded")) parameters.click_action = element.getAttribute("aria-expanded") === "true" ? "close" : "open";
  return { name, parameters };
}

export function initializeAnalytics(win: AnalyticsWindow, measurementId: string) {
  if (!canTrack(measurementId, win.location.hostname) || win.counselAnalyticsInitialized) return;
  win.counselAnalyticsInitialized = true;
  win.dataLayer ||= [];
  win.gtag ||= function () { win.dataLayer!.push(arguments); };
  win.gtag("js", new Date());
  win.gtag("config", measurementId, {
    page_location: analyticsPageUrl(win.location.href),
    page_referrer: win.document.referrer ? destination(win.document.referrer, win.location.href) : "",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const send = (name: string, parameters: Parameters) => {
    try {
      win.gtag?.("event", name, { ...parameters, send_to: measurementId, transport_type: "beacon" });
    } catch {
      // Analytics must never interfere with navigation, calling, or the forms.
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (event.type === "auxclick" && event.button !== 1) return;
    const target = event.target as Element | null;
    const element = target?.closest?.(clickableSelector);
    if (!element || element.closest('[disabled], [aria-disabled="true"], [data-analytics-ignore], [contenteditable="true"]')) return;
    try {
      const { name, parameters } = clickEvent(element, win.location.href);
      send(name, parameters);
    } catch {
      // See above.
    }
  };
  // Capture observes the state before menus/FAQs toggle, and runs before the consultation
  // dialog cancels its link's navigation. Native keyboard activation also produces a click.
  win.document.addEventListener("click", handleClick, { capture: true });
  win.document.addEventListener("auxclick", handleClick, { capture: true });
  // Only the form's name is sent. Field values never reach analytics.
  win.document.addEventListener(formSentEvent, event => {
    const form = (event as CustomEvent<{ form?: string; element?: Element }>).detail;
    const name = form?.form && formEvents[form.form];
    if (!name) return;
    send(name, {
      form_name: form.form!,
      click_location: form.element ? placement(form.element) : "page",
      page_path: win.location.pathname,
    });
  });
  const script = win.document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  win.document.head.append(script);
}
