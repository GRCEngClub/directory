function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

module.exports = {
  layout: "layouts/chapter.njk",
  permalink: (data) => "chapters/" + (data.slug || data.page.fileSlug) + "/index.html",
  tags: "chapters-content",
  eleventyComputed: {
    slug: (data) => data.slug || data.page.fileSlug,
    title: (data) =>
      data.city
        ? data.city + " Chapter Leads - GRC Engineer Directory"
        : "Chapter Leads - GRC Engineer Directory",
    status: (data) => data.status || "provisional",
    leads: (data) => asArray(data.leads).filter((lead) => lead && lead.name),
    description: (data) =>
      data.description ||
      (data.city
        ? "GRC Engineering Club chapter leads in " + data.city
        : "GRC Engineering Club chapter leads"),
    eleventyExcludeFromCollections: (data) =>
      String(data.page.fileSlug || "").startsWith("_")
  }
};
