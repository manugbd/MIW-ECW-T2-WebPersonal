module.exports = function (eleventyConfig) {
    // Copia directa de carpetas de recursos estáticos a la carpeta de salida
    eleventyConfig.addPassthroughCopy({ "src/css": "css" });
    eleventyConfig.addPassthroughCopy({ "src/js": "js" });
    eleventyConfig.addPassthroughCopy({ "src/img": "img" });
    eleventyConfig.addPassthroughCopy({ "src/video": "video" });
    eleventyConfig.addPassthroughCopy({ "src/audio": "audio" });
    eleventyConfig.addPassthroughCopy({ "src/docs": "docs" });

    eleventyConfig.addPassthroughCopy({ "src/img/favicon.ico": "favicon.ico" });

    return {
        dir: {
            input: "src",
            output: "public",
            includes: "_includes"
        },
        templateFormats: ["njk", "html", "md"],
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk"
    };
};
