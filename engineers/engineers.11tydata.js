const SITE_NAME = "GRC Engineer Directory";
const MAX_DESC = 155;

// Meta descriptions are measured after HTML escaping, and "&" costs 5 characters
// as "&amp;". Specialization names like "Audit & Assurance" are common enough that
// budgeting against the raw string overshoots the SERP truncation limit.
function escapedLength(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").length;
}

function article(word) {
  return /^[aeiou]/i.test(String(word || "")) ? "an" : "a";
}

function clamp(str) {
  if (escapedLength(str) <= MAX_DESC) return str;
  let out = str;
  while (out.length && escapedLength(out) > MAX_DESC - 1) {
    out = out.slice(0, out.lastIndexOf(" "));
  }
  return `${out}…`;
}

function buildSeoTitle(data) {
  if (!data.name) return null;
  return `${data.name} - ${data.title || "GRC Engineer"} | ${SITE_NAME}`;
}

function buildSeoDescription(data) {
  if (!data.name) return null;

  const role = data.title || "GRC engineer";
  let out = `${data.name} is ${article(role)} ${role}`;

  const add = (clause) => {
    const next = `${out} ${clause}`;
    if (escapedLength(next) <= MAX_DESC) out = next;
  };

  if (data.company) add(`at ${data.company}`);
  if (data.location) add(`in ${data.location}`);
  out = `${clamp(out)}.`;

  const specializations = Array.isArray(data.specializations) ? data.specializations : [];
  if (specializations.length) {
    add(`Specializes in ${specializations.slice(0, 3).join(", ")}.`);
  }

  const frameworks = Array.isArray(data.frameworks) ? data.frameworks : [];
  if (frameworks.length) {
    add(`Frameworks: ${frameworks.slice(0, 3).join(", ")}.`);
  }

  return out;
}

module.exports = {
  layout: "layouts/profile.njk",
  permalink: "engineers/{{ github }}/index.html",
  tags: "engineers",
  eleventyComputed: {
    eleventyExcludeFromCollections: data => data.page.fileSlug === "_template",
    isEngineerProfile: () => true,
    seoTitle: data => buildSeoTitle(data),
    seoDescription: data => buildSeoDescription(data)
  }
};
