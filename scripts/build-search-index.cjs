// Construye el índice local después de generar las páginas HTML con Eleventy.
const fs = require("node:fs");
const path = require("node:path");
const { parseDocument } = require("htmlparser2");
const { routes, locales } = require("../src/_data/i18n");

const includedPages = Object.entries(routes).filter(
  ([key]) => !["notFound", "search"].includes(key),
);

// Busca nodos del HTML generado para extraer su contenido y metadatos.
function findElements(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.children || []) findElements(child, predicate, found);
  return found;
}

// Extrae texto legible sin incluir scripts, estilos ni contenido alternativo oculto.
function textContent(node) {
  if (node.type === "text") return node.data;
  if (
    Object.prototype.hasOwnProperty.call(node.attribs || {}, "hidden") ||
    ["script", "style", "noscript", "template"].includes(node.name)
  ) {
    return "";
  }
  return (node.children || []).map(textContent).join(" ");
}

function withPrefix(prefix, route) {
  // Replica el prefijo de GitHub Pages en las rutas del archivo de índice.
  const normalizedPrefix = `/${String(prefix || "/").split("/").filter(Boolean).join("/")}`;
  const base = normalizedPrefix === "/" ? "" : normalizedPrefix;
  return `${base}${route}`;
}

async function buildSearchIndex(outputDirectory = "public") {
  // Lee cada versión traducida y solo indexa documentos públicos con contenido principal.
  const outputRoot = path.resolve(__dirname, "..", outputDirectory);
  const prefix = process.env.ELEVENTY_PATH_PREFIX || "/";
  const pages = [];

  for (const [key, variants] of includedPages) {
    for (const locale of locales) {
      const route = variants[locale.code];
      const relativeRoute = withPrefix(prefix, route).replace(/^\/+/, "");
      const htmlPath = path.join(outputRoot, relativeRoute, "index.html");
      if (!fs.existsSync(htmlPath)) continue;

      const document = parseDocument(fs.readFileSync(htmlPath, "utf8"));
      const elements = findElements(document, (node) => !!node.attribs);
      const robots = elements.find(
        (node) => node.name === "meta" && node.attribs.name === "robots",
      );
      if (robots?.attribs.content?.includes("noindex")) continue;

      const main = elements.find(
        (node) => node.name === "main" && node.attribs.id === "contenido-principal",
      );
      if (!main) continue;

      const heading = findElements(main, (node) => node.name === "h1")[0];
      const description = elements.find(
        (node) => node.name === "meta" && node.attribs.name === "description",
      );
      const language = elements.find((node) => node.name === "html")?.attribs.lang || locale.code;

      pages.push({
        title: textContent(heading || main).replace(/\s+/g, " ").trim(),
        description: description?.attribs.content || "",
        url: withPrefix(prefix, route),
        lang: language,
        content: textContent(main).replace(/\s+/g, " ").trim(),
      });
    }
  }

  const indexPath = path.join(outputRoot, withPrefix(prefix, "/search-index.json").replace(/^\/+/, ""));
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, `${JSON.stringify(pages)}\n`, "utf8");
}

module.exports = buildSearchIndex;
