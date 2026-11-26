function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortByRecent(a, b) {
  const aDate = toValidDate(a.data.posted_date) || toValidDate(a.date) || new Date(0);
  const bDate = toValidDate(b.data.posted_date) || toValidDate(b.date) || new Date(0);
  return bDate - aDate;
}

function isLiveJob(data) {
  const status = String(data.status || "published").toLowerCase();
  if (["draft", "expired", "filled", "archived"].includes(status)) return false;

  const expires = toValidDate(data.expires_date);
  if (!expires) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expires >= today;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function normalizedSet(values) {
  return new Set(asArray(values).map((item) => String(item).toLowerCase()));
}

function overlapScore(sourceSet, values, weight) {
  return asArray(values).reduce((score, value) => {
    return score + (sourceSet.has(String(value).toLowerCase()) ? weight : 0);
  }, 0);
}

module.exports = function (eleventyConfig) {
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("AGENTS.md");
  eleventyConfig.ignores.add("CLAUDE.md");
  eleventyConfig.ignores.add("CONTRIBUTING.md");
  eleventyConfig.ignores.add("CODE_OF_CONDUCT.md");
  eleventyConfig.ignores.add("snapshot-nav.md");
  eleventyConfig.ignores.add(".impeccable.md");
  eleventyConfig.ignores.add(".github/**");
  eleventyConfig.ignores.add(".agent/**");
  eleventyConfig.ignores.add(".agents/**");
  eleventyConfig.ignores.add(".claude/**");
  eleventyConfig.ignores.add(".crush/**");
  eleventyConfig.ignores.add(".kiro/**");
  eleventyConfig.ignores.add("engineers/_template.md");
  eleventyConfig.ignores.add("jobs/_template.md");
  eleventyConfig.ignores.add("jobs/**/_template.md");
  eleventyConfig.ignores.add("chapters/_template.md");

  eleventyConfig.addCollection("engineers", function (api) {
    return api
      .getFilteredByGlob("engineers/*.md")
      .filter((item) => item.page.fileSlug !== "_template")
      // Same order search.js uses for "Name A-Z", so the server-rendered first
      // page matches what the script shows and nothing shifts on load.
      .sort((a, b) =>
        String(a.data.name || "").toLowerCase().localeCompare(String(b.data.name || "").toLowerCase())
      );
  });

  eleventyConfig.addCollection("allJobs", function (api) {
    return api
      .getFilteredByGlob("jobs/**/*.md")
      .filter((item) => !String(item.page.fileSlug || "").startsWith("_"))
      .sort(sortByRecent);
  });

  eleventyConfig.addCollection("jobs", function (api) {
    return api
      .getFilteredByGlob("jobs/**/*.md")
      .filter((item) => !String(item.page.fileSlug || "").startsWith("_"))
      .filter((item) => isLiveJob(item.data))
      .sort(sortByRecent);
  });

  eleventyConfig.addCollection("chapters", function (api) {
    return api
      .getFilteredByGlob("chapters/*.md")
      .filter((item) => item.page.fileSlug !== "_template")
      .sort((a, b) => {
        const statusRank = { official: 0, provisional: 1, open: 2 };
        const aRank = statusRank[String(a.data.status || "").toLowerCase()] ?? 9;
        const bRank = statusRank[String(b.data.status || "").toLowerCase()] ?? 9;
        if (aRank !== bRank) return aRank - bRank;
        return String(a.data.city || "").localeCompare(String(b.data.city || ""));
      });
  });

  eleventyConfig.addPassthroughCopy("site/assets");
  eleventyConfig.addPassthroughCopy({ "site/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "site/logo.jpeg": "logo.jpeg" });

  eleventyConfig.addFilter("uniqueValues", function (collection, field) {
    const seen = new Map();
    collection.forEach((item) => {
      asArray(item.data[field]).forEach((v) => {
        if (v) {
          const key = String(v).toLowerCase();
          if (!seen.has(key)) seen.set(key, v);
        }
      });
    });
    return [...seen.values()].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  });

  eleventyConfig.addFilter("countValues", function (collection, field) {
    const counts = {};
    const canonical = {};
    collection.forEach((item) => {
      asArray(item.data[field]).forEach((v) => {
        if (v) {
          const key = String(v).toLowerCase();
          if (!canonical[key]) canonical[key] = v;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .reduce((obj, [key, count]) => { obj[canonical[key]] = count; return obj; }, {});
  });

  // Display labels for `available_for` values. Stored values stay lowercase
  // (they drive filters and URLs); only the visible text changes. "hiring"
  // means the engineer is hiring, so it reads "Is hiring" rather than
  // "Hiring", which visitors took to mean "available to be hired".
  const AVAILABILITY_LABELS = {
    "open-source": "Open source",
    hiring: "Is hiring"
  };
  eleventyConfig.addFilter("availabilityLabel", function (value) {
    const raw = String(value || "").trim();
    const key = raw.toLowerCase();
    if (AVAILABILITY_LABELS[key]) return AVAILABILITY_LABELS[key];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });

  // Importers derive some company names from ATS board slugs ("Openai",
  // "Andurilindustries"). Map the known ones to their real names for display.
  const COMPANY_NAMES = {
    openai: "OpenAI",
    andurilindustries: "Anduril Industries",
    "1password": "1Password",
    xai: "xAI",
    "kraken.com": "Kraken"
  };
  eleventyConfig.addFilter("companyName", function (value) {
    const raw = String(value || "").trim();
    return COMPANY_NAMES[raw.toLowerCase()] || raw;
  });

  // Top N values of a field with counts, for the "Browse the directory" lists.
  eleventyConfig.addFilter("topValues", function (collection, field, limit, minCount) {
    const counts = new Map();
    collection.forEach((item) => {
      asArray(item.data[field]).forEach((v) => {
        if (!v) return;
        const key = String(v).toLowerCase();
        const entry = counts.get(key) || { label: String(v), value: key, count: 0 };
        entry.count += 1;
        counts.set(key, entry);
      });
    });
    return [...counts.values()]
      .filter((entry) => entry.count >= (minCount || 1))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, limit || 8);
  });

  eleventyConfig.addFilter("lower", function (str) {
    return (str || "").toLowerCase();
  });

  eleventyConfig.addFilter("slugify", function (str) {
    return (str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  });

  eleventyConfig.addFilter("socialUrl", function (social, value) {
    if (!value) return null;
    value = String(value);
    if (social.stripAt) value = value.replace(/^@/, "");
    return social.urlPrefix ? social.urlPrefix + value : value;
  });

  eleventyConfig.addFilter("readableDate", function (value) {
    const date = toValidDate(value);
    if (!date) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  });

  eleventyConfig.addFilter("relatedEngineers", function (engineers, specializations, frameworks, languages, limit) {
    const specSet = normalizedSet(specializations);
    const frameworkSet = normalizedSet(frameworks);
    const languageSet = normalizedSet(languages);

    return (engineers || [])
      .map((engineer) => {
        const score =
          overlapScore(specSet, engineer.data.specializations, 4) +
          overlapScore(frameworkSet, engineer.data.frameworks, 2) +
          overlapScore(languageSet, engineer.data.languages, 1);

        return { engineer, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.engineer.data.name.localeCompare(b.engineer.data.name);
      })
      .slice(0, limit || 3)
      .map((item) => item.engineer);
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "site/_includes",
      data: "site/_data",
    },
    markdownTemplateEngine: "njk",
  };
};
