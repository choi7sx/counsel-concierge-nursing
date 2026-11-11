// /llms.txt (https://llmstxt.org): a plain-language summary of the practice
// for AI assistants and answer engines, built from the site's own content so
// it stays current when pages are edited in CloudCannon.
import { articles, links, pageAt, postOpService, retainerServices, situationalServices } from "../lib/counsel";
import { EMAIL, SITE, absolute, faqs } from "../lib/seo";

const list = (html = "") =>
  [...html.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim());

export function GET() {
  const services = pageAt(links.services);
  const is = list(services.blocks[10].html);
  const isNot = list(services.blocks[12].html);
  const questions = [...faqs(services), ...faqs(pageAt(links.postop))];
  const situational = situationalServices.filter((service) => service !== postOpService);
  const item = (service: { title: string; path: string; text: string }) =>
    `- [${service.title}](${absolute(service.path)}): ${service.text}`;

  const text = `# Counsel Concierge Nursing

> Counsel Concierge Nursing is a private, registered nurse-led concierge nursing practice in Nashville, Tennessee. It provides personalized clinical oversight, care coordination, and advocacy for independent adults and their families in Nashville and the surrounding Middle Tennessee area, with the goal of preserving independence and aging in place.

## Key facts

- Location and service area: Nashville, TN and surrounding Middle Tennessee. Care is provided in clients' homes, at appointments, at hospitals and surgical facilities, and while traveling.
- Founder: Augustus "Gus" Osgood, BSN, RN, a registered nurse with a background in critical care, emergency, and surgical nursing.
- Payment: private pay only. Counsel is not covered by Medicare or private insurance.
- Counsel is: ${is.join("; ")}.
- Counsel is not: ${isNot.join("; ")}.
- Services are offered two ways: monthly retainer care plans for ongoing oversight, and situational services for a specific event or short-term need, typically a day or two.
- Post-operative recovery care is the most requested service. Day-of-surgery RN accompaniment, from pickup to recovery at home, starts at $750.
- Getting started: every engagement begins with a complimentary discovery call, followed by a private in-person consultation to evaluate needs and create a personalized care plan.
- Contact: phone (615) 933-9208, email ${EMAIL}, or request a consultation at ${absolute(links.consultation)}
- Counsel provides private nursing oversight and does not replace a primary care provider or emergency services.

## Services

- [All services](${absolute(links.services)}): Monthly retainer and situational services.
- [${postOpService.title}](${absolute(postOpService.path)}): ${postOpService.summary} Pre-op preparation, day-of-surgery RN accompaniment, and in-home recovery oversight.

### Monthly retainer services

${retainerServices.map(item).join("\n")}

### Situational services

${situational.map(item).join("\n")}

## About and contact

- [Home](${SITE}/)
- [About Counsel and its founder](${absolute(links.about)})
- [Our approach: Discover, Consult, Design, Care](${absolute("/approach")})
- [Private nursing consultation](${absolute(links.consultation)})
- [Contact](${absolute(links.contact)})

## Insights

- [All insights](${absolute("/insights")})
${articles.map((a) => `- [${a.title}](${absolute(a.path)}): ${a.description}`).join("\n")}

## Frequently asked questions

${questions.map((q) => `### ${q.question}\n\n${q.answer}`).join("\n\n")}

## Optional

- [Sitemap](${SITE}/sitemap.xml)
- [Insights RSS feed](${SITE}/insights/rss.xml)
- [Work with us](${absolute("/work-with-us")}): Opportunities for experienced registered nurses.
- [Privacy policy](${absolute("/privacy-policy")})
- [Terms of use](${absolute("/terms-of-use")})
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
