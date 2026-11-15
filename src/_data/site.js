// GitHub Pages supplies the public URL, including any repository subpath.
const configured = process.env.SITE_URL || "";
const localSitemapBase = "https://author.carburo.app";

const parsed = configured ? new URL(configured) : null;
if (parsed && !["https:", "http:"].includes(parsed.protocol)) {
  throw new Error("SITE_URL debe ser una URL HTTP o HTTPS.");
}
const updated = "2026-11-13"; // Edita únicamente esta fecha: AAAA-MM-DD.

module.exports = {
  name: "Manuel García Baldó",
  url: parsed ? parsed.href.replace(/\/$/, "") : "",
  // El índice XML también se puede inspeccionar localmente con URLs públicas válidas.
  sitemapUrl: parsed ? parsed.href.replace(/\/$/, "") : localSitemapBase,
  image: "/img/foto-personal-perfil.jpeg",
  imageAlt: "Fotografía de Manuel García Baldó",
  linkedin: "https://www.linkedin.com/",
  // Fecha de la última revisión del contenido (AAAA-MM-DD).
  updated,
  updatedLabel: new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${updated}T00:00:00Z`)),
  profiles: ["https://github.com/manugbd"]
};
