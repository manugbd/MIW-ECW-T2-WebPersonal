const { strings, locales } = require("./i18n");
module.exports = {
  t: (data) => strings[data.lang || "es"],
  locale: (data) => locales.find((item) => item.code === (data.lang || "es")),
  updatedLabel: (data) =>
    new Intl.DateTimeFormat(data.lang || "es", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(data.site.updated + "T00:00:00Z")),
};
