module.exports = function (eleventyConfig) {
  const site = require("./src/_data/site.js");
  const absoluteUrl = (path) =>
    site.url
      ? new URL(String(path).replace(/^\//, ""), `${site.url}/`).href
      : "";
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
  eleventyConfig.addFilter("structuredData", (data) => {
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
        name: `${site.name} · Web personal`,
        inLanguage: "es",
        author: { "@id": personId },
      },
      {
        "@type": data.page.url === "/perfil/" ? "ProfilePage" : "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: data.seoTitle || data.title,
        description: data.description,
        inLanguage: "es",
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
        ...(data.page.url === "/perfil/"
          ? { mainEntity: { "@id": personId } }
          : {}),
      },
    ];
    if (data.page.url !== "/") {
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: absoluteUrl("/"),
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
