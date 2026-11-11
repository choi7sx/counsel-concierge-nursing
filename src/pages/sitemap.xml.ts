import { articles, pages, servicePages } from "../lib/counsel";
import { SITE } from "../lib/seo";
export function GET() {
  const paths = [
    "/",
    ...pages
      .filter((page) => page.path !== "/home" && !page.noindex)
      .map((page) => page.path),
    "/approach",
    ...servicePages.map((page) => page.path),
  ];
  // Only articles carry a reliable date. Search engines ignore lastmod values
  // that change on every build, so other pages omit it.
  const lastmod = (path: string) => {
    const date = path === "/insights" ? articles[0]?.date : articles.find((a) => a.path === path)?.date;
    return date ? `<lastmod>${date}</lastmod>` : "";
  };
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${SITE}${path}</loc>${lastmod(path)}</url>`).join("")}</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
