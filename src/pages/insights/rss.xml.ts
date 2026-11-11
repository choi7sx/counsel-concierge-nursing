import rss from "@astrojs/rss";
import { articles } from "../../lib/counsel";
import { SITE } from "../../lib/seo";
export function GET() {
  return rss({
    title: "Counsel Concierge Nursing Insights",
    description:
      "Perspective and guidance on aging at home, surgical recovery, and care coordination from a registered nurse in Nashville, TN.",
    site: SITE,
    // Match the canonical URLs, which have no trailing slash.
    trailingSlash: false,
    items: articles.map((article) => ({
      title: article.title,
      link: article.path,
      pubDate: new Date(article.date!),
      description: article.description,
      author: `info@counselconciergenursing.com (${article.author || "Gus Osgood"})`,
      categories: [article.category],
    })),
    customData: "<language>en-us</language>",
  });
}
