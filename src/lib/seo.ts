// Search and answer-engine metadata: share images and schema.org JSON-LD.
// Every fact here comes from the site's own content, so search engines and AI
// assistants describe the practice exactly as the pages do.
import {
  articles,
  links,
  pages,
  postOpService,
  retainerServices,
  serviceHeroes,
  servicePages,
  situationalServices,
} from "./counsel";
import type { Block, Page } from "./counsel";

export const SITE = "https://counselconciergenursing.com";
export const SITE_NAME = "Counsel Concierge Nursing";
export const PHONE = "+1-615-933-9208";
export const EMAIL = "info@counselconciergenursing.com";
export const absolute = (path: string) => new URL(path, SITE).href;

const ORG_ID = `${SITE}/#organization`;
const FOUNDER_ID = `${SITE}/#founder`;
const WEBSITE_ID = `${SITE}/#website`;

// Photo key (see data/counsel-images.json) used as each page's share image.
// scripts/prepare-share-assets.mjs crops these to 1200×630 in /images/og/.
const shareImageKey = (path: string) => {
  const article = articles.find((a) => a.path === path);
  if (article) return article.image.split("/").pop()!.replace(/\.webp$/, "");
  const slug = path.match(/^\/services\/(.+)/)?.[1];
  if (slug) return serviceHeroes[slug]?.image || "care";
  return (
    {
      [links.about]: "porch",
      [links.services]: "greeting",
      [links.postop]: "postop",
      [links.contact]: "greeting",
    } as Record<string, string>
  )[path] || "care";
};
export const shareImage = (path: string) => `/images/og/${shareImageKey(path)}.jpg`;

const areaServed = [
  { "@type": "City", name: "Nashville", containedInPlace: { "@type": "State", name: "Tennessee" } },
  { "@type": "AdministrativeArea", name: "Middle Tennessee" },
];

const organization = {
  // Schema.org has no type for a nursing practice. LocalBusiness is the
  // accurate general type; the description names it a concierge nursing
  // practice, as the About page does. (MedicalBusiness would class it with
  // clinics and medical offices, which Counsel is not.)
  "@type": "LocalBusiness",
  "@id": ORG_ID,
  name: SITE_NAME,
  legalName: "Counsel Concierge Nursing, LLC",
  alternateName: "Counsel",
  url: `${SITE}/`,
  logo: {
    "@type": "ImageObject",
    url: absolute("/images/brand/counsel-logo-original.jpeg"),
    width: 1261,
    height: 1261,
  },
  image: absolute("/images/og/care.jpg"),
  description:
    "Counsel Concierge Nursing is a Nashville, Tennessee-based concierge nursing practice providing private nursing oversight for adults and their families, focused on personalized clinical oversight, care coordination, and advocacy.",
  slogan: "Independence, enhanced. Peace of mind, protected.",
  telephone: PHONE,
  email: EMAIL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nashville",
    addressRegion: "TN",
    addressCountry: "US",
  },
  areaServed,
  founder: { "@id": FOUNDER_ID },
  priceRange: "$$$",
  paymentAccepted: "Private pay",
  knowsAbout: [
    "Concierge nursing",
    "Post-operative recovery care",
    "Care coordination",
    "Care transitions",
    "Medication management",
    "Chronic disease management",
    "Fall prevention",
    "Aging in place",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: PHONE,
    email: EMAIL,
    areaServed: "US-TN",
    availableLanguage: "English",
  },
  sameAs: [
    "https://www.instagram.com/counselconciergenursing",
    "https://www.facebook.com/share/1CtNJRkpGv/?mibextid=wwXIfr",
  ],
};

const founder = {
  "@type": "Person",
  "@id": FOUNDER_ID,
  name: "Augustus Osgood",
  alternateName: "Gus Osgood",
  honorificSuffix: "BSN, RN",
  jobTitle: "Founder and Registered Nurse",
  description:
    "Registered nurse with a background in critical care, emergency, and surgical nursing; founder of Counsel Concierge Nursing in Nashville, Tennessee.",
  image: absolute("/images/counsel/founder.webp"),
  url: absolute(links.about),
  worksFor: { "@id": ORG_ID },
  hasCredential: [
    { "@type": "EducationalOccupationalCredential", credentialCategory: "degree", name: "Bachelor of Science in Nursing (BSN)" },
    { "@type": "EducationalOccupationalCredential", credentialCategory: "license", name: "Registered Nurse (RN)" },
  ],
  sameAs: ["https://linkedin.com/in/augustusosgood"],
};

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE}/`,
  name: SITE_NAME,
  publisher: { "@id": ORG_ID },
  inLanguage: "en-US",
};

const plain = (html = "") =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// Visible accordion FAQs on a page, for FAQPage markup and llms.txt.
export const faqs = (page: Page) =>
  page.blocks
    .filter((block, i, blocks): block is Block & { items: NonNullable<Block["items"]> } =>
      block.type === "accordion" && /Frequently Asked Questions/i.test(blocks[i - 1]?.html || ""),
    )
    .flatMap((block) => block.items)
    .map((item) => ({ question: item.title, answer: plain(item.html) }));

const faqPage = (page: Page, url: string) => {
  const items = faqs(page);
  return items.length
    ? {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        isPartOf: { "@id": `${url}#webpage` },
        mainEntity: items.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      }
    : null;
};

const allServices = [...retainerServices, ...situationalServices].filter(
  (service, i, all) => all.findIndex((s) => s.path === service.path) === i,
);

const service = (path: string, url: string) => {
  const entry = allServices.find((s) => s.path === path);
  if (!entry) return null;
  const retainer = retainerServices.some((s) => s.path === path);
  const situational = situationalServices.some((s) => s.path === path);
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: entry.title,
    serviceType: entry.title,
    category: [retainer && "Monthly retainer service", situational && "Situational service"].filter(Boolean),
    description: entry.text,
    url,
    provider: { "@id": ORG_ID },
    areaServed,
    audience: { "@type": "Audience", audienceType: "Independent adults and their families" },
    ...(entry === postOpService && {
      offers: {
        "@type": "Offer",
        description: "Day-of-surgery RN accompaniment, from pickup to recovery at home",
        priceSpecification: { "@type": "PriceSpecification", minPrice: 750, priceCurrency: "USD" },
      },
    }),
  };
};

const serviceCatalog = (url: string) => ({
  "@type": "OfferCatalog",
  "@id": `${url}#catalog`,
  name: "Concierge nursing services",
  itemListElement: allServices.map((s) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: s.title, url: absolute(s.path), description: s.summary },
  })),
});

const article = (page: Page, url: string, image: string) => {
  const entry = articles.find((a) => a.path === page.path);
  if (!entry) return null;
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: page.title,
    description: page.description,
    image,
    datePublished: entry.date,
    dateModified: entry.date,
    articleSection: entry.category,
    wordCount: (page.blocks[0]?.text || "").split(/\s+/).length,
    inLanguage: "en-US",
    author: { "@id": FOUNDER_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    isPartOf: { "@id": WEBSITE_ID },
  };
};

const breadcrumbTrail = (path: string, title: string) => {
  if (path === "/") return [];
  const trail = [{ name: "Home", path: "/" }];
  if (path.startsWith("/services/")) trail.push({ name: "Services", path: links.services });
  if (path.startsWith("/insights/")) trail.push({ name: "Insights", path: "/insights" });
  if (path === links.postop) trail.push({ name: "Services", path: links.services });
  return [...trail, { name: title, path }];
};

export function structuredData({
  path,
  title,
  description,
  image,
}: {
  path: string;
  title: string;
  description: string;
  image: string;
}) {
  const url = absolute(path);
  // The homepage renders the /home entry; service pages are generated from the catalog.
  const source = [...pages, ...servicePages].find((p) => p.path === (path === "/" ? "/home" : path));
  const pageType =
    path === links.about ? "AboutPage" :
    path === links.contact ? "ContactPage" :
    path === "/insights" ? "CollectionPage" : "WebPage";
  // Breadcrumbs use the short page title, not the search title.
  const crumbName = path === "/approach" ? "Our Approach" : source?.title || title.split(" | ")[0];
  const crumbs = breadcrumbTrail(path, crumbName.replace(/ in Nashville, TN$/, "").trim());
  const graph: Record<string, unknown>[] = [
    path === links.services ? { ...organization, hasOfferCatalog: { "@id": `${url}#catalog` } } : organization,
    founder,
    website,
    {
      "@type": pageType,
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORG_ID },
      primaryImageOfPage: { "@type": "ImageObject", url: image, width: 1200, height: 630 },
      ...(crumbs.length && { breadcrumb: { "@id": `${url}#breadcrumb` } }),
      ...(path === links.about && { mainEntity: { "@id": FOUNDER_ID } }),
    },
  ];
  if (crumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: crumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: absolute(crumb.path),
      })),
    });
  }
  const nodes = [source && faqPage(source, url), source && article(source, url, image), service(path, url)];
  graph.push(...nodes.filter((node): node is NonNullable<typeof node> => Boolean(node)));
  if (path === links.services) graph.push(serviceCatalog(url));
  return { "@context": "https://schema.org", "@graph": graph };
}
