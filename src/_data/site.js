// GitHub Pages supplies the public URL, including any repository subpath.
const configured = process.env.SITE_URL || "";
const parsed = configured ? new URL(configured) : null;
if (parsed && !["https:", "http:"].includes(parsed.protocol)) {
  throw new Error("SITE_URL debe ser una URL HTTP o HTTPS.");
}
module.exports = {
  name: "Manuel García Baldó",
  url: parsed ? parsed.href.replace(/\/$/, "") : "",
  image: "/img/foto-personal-perfil.jpeg",
  imageAlt: "Fotografía de Manuel García Baldó",
  profiles: ["https://github.com/manugbd"]
};
