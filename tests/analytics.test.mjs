import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { Window } from "happy-dom";
import { analyticsPageUrl, canTrack, clickEvent, formSentEvent, initializeAnalytics } from "../src/lib/analytics.ts";

const site = "https://counselconciergenursing.com/";
function browser(html = "", url = site) {
  const win = new Window({ url, settings: { disableJavaScriptFileLoading: true, disableJavaScriptEvaluation: true } });
  win.document.body.innerHTML = html;
  return win;
}
const events = win => (win.dataLayer || []).map(args => Array.from(args)).filter(args => args[0] === "event");
function click(win, selector, options = {}) {
  const event = new win.MouseEvent(options.type || "click", { bubbles: true, cancelable: true, ...options });
  win.document.querySelector(selector).dispatchEvent(event);
  return event;
}

test("tracking requires a valid ID and the production hostname", () => {
  assert.equal(canTrack("G-ABC123", "counselconciergenursing.com"), true);
  assert.equal(canTrack("G-ABC123", "www.counselconciergenursing.com"), true);
  for (const host of ["localhost", "127.0.0.1", "composed-dove.cloudvent.net", "counselconciergenursing.com.example.org", "portal.counselconciergenursing.com"]) {
    const win = browser("", `https://${host}/`);
    initializeAnalytics(win, "G-ABC123");
    assert.equal(win.dataLayer, undefined);
    assert.equal(win.document.querySelector("script"), null);
  }
  for (const id of ["", "GTM-ABC123", "invalid", "G-ABC<script>"]) assert.equal(canTrack(id, "counselconciergenursing.com"), false);
});

test("campaign attribution is preserved without arbitrary query data or hashes", () => {
  assert.equal(analyticsPageUrl(`${site}?email=client%40example.com&utm_source=newsletter&utm_campaign=fall&gclid=abc#consultation-request`),
    `${site}?utm_source=newsletter&utm_campaign=fall&gclid=abc`);
});

test("initialization is idempotent and nested SVG clicks produce one event without blocking navigation", () => {
  const win = browser('<section data-analytics-section="hero"><a href="/private-nursing-consultation-nashville">Request<svg><path /></svg></a></section>');
  initializeAnalytics(win, "G-ABC123");
  initializeAnalytics(win, "G-ABC123");
  const event = click(win, "path");
  assert.equal(event.defaultPrevented, false);
  assert.equal(win.document.querySelectorAll('script[src*="googletagmanager"]').length, 1);
  assert.equal(win.dataLayer.filter(args => args[0] === "config").length, 1);
  assert.equal(events(win).length, 1);
  assert.equal(events(win)[0][1], "consultation_click");
  assert.equal(events(win)[0][2].click_location, "hero");
});

test("consultation, contact, portal, reviews, social, and external links have distinct events", () => {
  const cases = [
    ['<a href="/private-nursing-consultation-nashville/">Consult</a>', "consultation_click"],
    ['<a href="https://counselconciergenursing.com/private-nursing-consultation-nashville">Consult</a>', "consultation_click"],
    ['<a href="tel:+16159339208">(615) 933-9208</a>', "phone_click"],
    ['<a href="mailto:info@counselconciergenursing.com?subject=secret">Email</a>', "email_click"],
    ['<a href="https://portal.counselconciergenursing.com">Client Portal</a>', "portal_click"],
    ['<ul class="review-links"><li><a href="https://g.page/r/review">Google</a></li></ul>', "reviews_click"],
    ['<a href="https://www.instagram.com/counselconciergenursing">Instagram</a>', "social_click"],
    ['<a href="https://linkedin.com/in/someone">LinkedIn</a>', "social_click"],
    ['<a href="https://example.org/">Elsewhere</a>', "external_link_click"],
    ['<a href="/guide.pdf" download>Download</a>', "download_click"],
    ['<footer><a href="/approach">Our Approach</a></footer>', "navigation_click"],
    ['<main><a href="/insights/article">Read</a></main>', "internal_link_click"],
  ];
  for (const [html, name] of cases) {
    const win = browser(html);
    const result = clickEvent(win.document.querySelector("a"), win.location.href);
    assert.equal(result.name, name, html);
    assert.doesNotMatch(JSON.stringify(result), /secret|info@|16159339208/);
  }
});

test("capture records open/close intent before UI handlers mutate state", () => {
  const win = browser('<button class="menu-toggle" aria-expanded="false">Menu</button><details class="accordion"><summary>Question</summary></details><details class="services-nav"><summary>Services</summary></details>');
  const button = win.document.querySelector("button");
  button.addEventListener("click", () => button.setAttribute("aria-expanded", "true"));
  initializeAnalytics(win, "G-ABC123");
  click(win, "button");
  assert.equal(events(win)[0][1], "menu_toggle");
  assert.equal(events(win)[0][2].click_action, "open");
  click(win, ".accordion summary");
  assert.equal(events(win)[1][1], "faq_toggle");
  assert.equal(events(win)[1][2].click_action, "open");
  win.document.querySelector(".accordion").setAttribute("open", "");
  click(win, ".accordion summary");
  assert.equal(events(win)[2][2].click_action, "close");
  click(win, ".services-nav summary");
  assert.equal(events(win)[3][1], "menu_toggle");
});

test("the consultation dialog's close button is named", () => {
  const win = browser('<dialog id="consultation-dialog"><button data-close-consultation aria-label="Close consultation request">×</button></dialog>');
  const result = clickEvent(win.document.querySelector("button"), win.location.href);
  assert.equal(result.name, "consultation_close");
  assert.equal(result.parameters.click_location, "consultation-dialog");
});

test("confirmed form submissions send the form name only", () => {
  const win = browser('<dialog id="consultation-dialog"><form data-analytics-form="consultation"><input name="_replyto" value="client@example.com"></form></dialog><form id="career" data-analytics-form="application"></form>');
  initializeAnalytics(win, "G-ABC123");
  const [consultation, application] = win.document.querySelectorAll("form");
  win.document.dispatchEvent(new win.CustomEvent(formSentEvent, { detail: { form: "consultation", element: consultation } }));
  win.document.dispatchEvent(new win.CustomEvent(formSentEvent, { detail: { form: "application", element: application } }));
  win.document.dispatchEvent(new win.CustomEvent(formSentEvent, { detail: { form: "unknown" } }));
  assert.deepEqual(events(win).map(e => e[1]), ["generate_lead", "application_submit"]);
  assert.equal(events(win)[0][2].form_name, "consultation");
  assert.equal(events(win)[0][2].click_location, "consultation-dialog");
  assert.doesNotMatch(JSON.stringify(events(win)), /client@example/);
});

test("delegation covers newly inserted links, keyboard activation, and middle clicks", () => {
  const win = browser();
  initializeAnalytics(win, "G-ABC123");
  win.document.body.innerHTML = '<nav><a href="/insights">Insights</a></nav>';
  click(win, "a", { detail: 0 }); // Native keyboard click.
  click(win, "a", { type: "auxclick", button: 1 });
  click(win, "a", { type: "auxclick", button: 2 });
  assert.equal(events(win).length, 2);
  assert.equal(events(win)[0][1], "navigation_click");
});

test("disabled, opted-out, editable, form-field, and plain content clicks are ignored", () => {
  const win = browser('<button disabled>Disabled</button><a aria-disabled="true" href="/">No</a><div data-analytics-ignore><button>Private</button></div><div contenteditable="true"><a href="/">Editing</a></div><p>Text</p><input value="private"><input type="radio">');
  initializeAnalytics(win, "G-ABC123");
  for (const element of win.document.querySelectorAll("button, a, p, input")) element.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  assert.equal(events(win).length, 0);
});

test("analytics failure does not cancel clicks", () => {
  const win = browser('<a href="tel:+16159339208">Call</a>');
  initializeAnalytics(win, "G-ABC123");
  win.gtag = () => { throw new Error("blocked"); };
  assert.equal(click(win, "a").defaultPrevented, false);
});

test("the form script announces confirmed submissions to analytics", () => {
  const source = readFileSync("src/scripts/consultation.ts", "utf8");
  assert.match(source, new RegExp(`dispatchEvent\\(new CustomEvent\\('${formSentEvent}'`));
  assert.match(readFileSync("src/components/counsel/ConsultationForm.astro", "utf8"), /data-analytics-form="consultation"/);
  assert.match(readFileSync("src/components/counsel/CareerForm.astro", "utf8"), /data-analytics-form="application"/);
});

test("all built pages include analytics wiring and every rendered control produces an event", () => {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (entry.name !== "pagefind") walk(path); }
      else if (path.endsWith(".html")) files.push(path);
    }
  }
  walk("dist");
  assert.ok(files.length >= 10);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    assert.match(html, /<meta name="ga-measurement-id" content="G-VNLPGMFKCT"/, file);
    // Astro may bundle the analytics component as an external or inline module.
    const win = browser(html);
    const modules = [...win.document.querySelectorAll('script[type="module"]')].map(script =>
      script.src ? readFileSync(`dist${new URL(script.src).pathname}`, "utf8") : script.textContent).join("\n");
    assert.match(modules, /ga-measurement-id/, file);
    initializeAnalytics(win, "G-ABC123");
    // Stop happy-dom from following links, which would replace the document mid-test.
    win.document.addEventListener("click", event => event.preventDefault());
    const controls = win.document.querySelectorAll('a[href], button:not([disabled]), summary, [role="button"]');
    assert.ok(controls.length > 0, file);
    for (const element of controls) {
      if (element.closest("[disabled]")) continue;
      const previous = events(win).length;
      element.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
      assert.equal(events(win).length, previous + 1, `${file}: ${element.outerHTML}`);
      assert.ok(events(win).at(-1)[2].click_text, `${file}: ${element.outerHTML}`);
      assert.ok(events(win).at(-1)[2].click_location);
    }
  }
});
