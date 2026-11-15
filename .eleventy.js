module.exports = function (eleventyConfig) {
  const site = require("./src/_data/site.js");
  const i18n = require("./src/_data/i18n.js");
  const buildSearchIndex = require("./scripts/build-search-index.cjs");

  eleventyConfig.addFilter("localizedUrl", (url, lang = "es") => {
    const [pathname, hash] = String(url).split("#");
    const route = Object.values(i18n.routes).find((routes) =>
      Object.values(routes).includes(pathname),
    );
    return (route ? route[lang] : pathname) + (hash ? "#" + hash : "");
  });

  const absoluteUrl = (path) => {
    const baseUrl = site.url || site.sitemapUrl;
    return baseUrl
      ? new URL(String(path).replace(/^\//, ""), `${baseUrl}/`).href
      : "";
  };

  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);
  eleventyConfig.addFilter("jsonLd", (value) =>
    JSON.stringify(value).replace(/</g, "\\u003c"),
  );
  eleventyConfig.addCollection("seoPages", (collection) =>
    collection
      .getAll()
      .filter((item) => item.data.layout === "base.njk" && !item.data.noindex)
      .sort((a, b) => a.url.localeCompare(b.url)),
  );

  // Genera el índice desde los HTML finales, tanto en compilaciones como en el servidor local.
  eleventyConfig.on("eleventy.after", async ({ directories, dir } = {}) => {
    await buildSearchIndex(directories?.output || dir?.output || "public");
  });

  eleventyConfig.addFilter("structuredData", (data) => {
    const language = data.lang || "es";
    const homeUrl = absoluteUrl(i18n.routes.home[language]);
    const isProfile = data.translationKey === "profile";
    const personId = `${absoluteUrl("/")}#person`;
    const websiteId = `${absoluteUrl("/")}#website`;
    const pageUrl = absoluteUrl(data.page.url);
    const graph = [
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        url: absoluteUrl("/"),
        image: absoluteUrl(site.image),
        sameAs: site.profiles,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: absoluteUrl("/"),
        name: `${site.name} — ${i18n.strings[language].personalSite}`,
        inLanguage: language,
        author: { "@id": personId },
      },
      {
        "@type": isProfile ? "ProfilePage" : "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: data.seoTitle || data.title,
        description: data.description,
        dateModified: site.updated,
        inLanguage: language,
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
        ...(isProfile ? { mainEntity: { "@id": personId } } : {}),
      },
    ];

    if (data.translationKey !== "home") {
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: i18n.strings[language].home,
            item: homeUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: data.breadcrumb || data.title,
            item: pageUrl,
          },
        ],
      });
    }
    return { "@context": "https://schema.org", "@graph": graph };
  });
  
  // Copia directa de carpetas de recursos estáticos a la carpeta de salida
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/video": "video" });
  eleventyConfig.addPassthroughCopy({ "src/audio": "audio" });
  eleventyConfig.addPassthroughCopy({ "src/docs": "docs" });

  eleventyConfig.addPassthroughCopy({ "src/img/favicon.ico": "favicon.ico" });

  return {
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/",
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
