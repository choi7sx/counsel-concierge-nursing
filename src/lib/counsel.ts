import source from "../../data/counsel-content.json";
export type Block = {
  type: string;
  html?: string;
  text?: string;
  items?: { title: string; html: string }[];
};
export type Page = {
  path: string;
  title: string;
  metaTitle?: string;
  description: string;
  blocks: Block[];
  date?: string;
  author?: string;
  category?: string;
  image?: string;
  excerpt?: string;
  form?: { url: string; name: string; fields: unknown[] };
};
const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(amp|nbsp|lt|gt|quot|#39);/g,
      (entity) =>
        (
          ({
            "&amp;": "&",
            "&nbsp;": " ",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": '"',
            "&#39;": "'",
          }) as Record<string, string>
        )[entity] || entity,
    )
    .replace(/\s+/g, " ")
    .trim();
export const pages: Page[] = source.pages.map((page) => ({
  ...page,
  blocks: page.blocks.map((block) => ({
    ...block,
    text: "html" in block && block.html ? plainText(block.html) : "",
  })),
})) as Page[];
export const pageAt = (path: string) => pages.find((p) => p.path === path)!;
export const links = {
  about: "/about-concierge-nursing-nashville",
  services: "/concierge-nursing-services-nashville",
  consultation: "/private-nursing-consultation-nashville",
  contact: "/contact-concierge-nursing-nashville",
  postop: "/post-operative-care-nashville",
  portal: "https://portal.counselconciergenursing.com",
};
export const approach = [
  {
    title: "Discover",
    image: "greeting",
    imageAlt: "Gus greeting a client at her front door",
    text: "A complimentary, no obligation conversation to understand your situation.",
  },
  {
    title: "Consult",
    image: "consult",
    imageAlt: "Gus listening to a client and her family at their kitchen table",
    text: "A comprehensive family discussion to assess health history, needs, and goals.",
  },
  {
    title: "Design",
    image: "care",
    imageAlt: "Gus reviewing a care plan with a couple at their dining table",
    text: "A care plan designed around each client & family’s specific needs. We take everything into consideration.",
  },
  {
    title: "Care",
    image: "porch",
    imageAlt: "Gus sharing a warm greeting with a client on her porch",
    text: "Ongoing clinical oversight built on proactive prevention — designed to enhance independence.",
  },
];
const servicesBlocks = pageAt(links.services).blocks;
// Card summaries use the client's own bold introductory phrases verbatim.
const serviceEntry = (item: { title: string; html: string }) => {
  const slug = item.title.toLowerCase().replace(/ & /g, " ").replace(/\s+/g, "-");
  return {
    ...item,
    slug,
    // Post-op keeps its established page rather than moving under /services/.
    path: slug === "post-op-recovery-care" ? links.postop : `/services/${slug}`,
    summary: plainText(item.html.match(/<strong>(.*?)<\/strong>/)?.[1] || item.html),
    text: plainText(item.html),
  };
};
export const retainerServices = servicesBlocks[4].items!.map(serviceEntry);
export const situationalServices = servicesBlocks[8].items!.map(serviceEntry);
export const postOpService = situationalServices.find((service) => service.path === links.postop)!;
// A service offered both ways is listed in both groups but keeps one URL, so
// its retainer and situational descriptions share a page instead of competing.
export const servicePages: Page[] = [...retainerServices, ...situationalServices]
  .filter((service, i, all) =>
    service.path.startsWith("/services/") && all.findIndex((s) => s.path === service.path) === i,
  )
  .map((service) => ({
    path: service.path,
    title: service.title,
    metaTitle: `${service.title} in Nashville, TN`,
    description: service.text,
    blocks: [{ type: "html", html: service.html, text: service.text }],
  }));
// Longer service copy kept on the Services page content entry.
export const serviceDetails: Record<string, Block> = {
  "care-transitions": servicesBlocks[7],
  "travel-accompaniment": servicesBlocks[6],
};
export const serviceHeroes: Record<string, { image: string; alt: string }> = {
  "care-transitions": { image: "transitions", alt: "A hospital stretcher waiting in a quiet corridor" },
  "travel-accompaniment": { image: "travel", alt: "The cabin of a private aircraft" },
};
export const articles = pages
  .filter((p) => p.path.startsWith("/insights/"))
  .map((p) => ({
    ...p,
    category: p.category || "From our practice",
    image: p.image || "/images/counsel/consult.webp",
    excerpt: p.excerpt || "",
  }))
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
export const dateLabel = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";
