const fs = require("fs/promises");
const path = require("path");
const { greenhouseBoards: catalogGreenhouseBoards, ashbyBoards: catalogAshbyBoards, workableBoards: catalogWorkableBoards, leverBoards: catalogLeverBoards, ripplingBoards: catalogRipplingBoards } = require("./job-board-sources");

const ROOT = process.cwd();
const IMPORT_ROOT = path.join(ROOT, "jobs", "imported");
const USER_AGENT = "GRC Engineer Directory Job Importer/1.0 (+https://directory.grcengclub.com)";

const FRAMEWORK_RULES = [
  ["FedRAMP", ["fedramp", "govramp", "state ramp", "state-ramp"]],
  ["SOC 2", ["soc 2", "soc2"]],
  ["ISO 27001", ["iso 27001", "iso27001"]],
  ["ISO 42001", ["iso 42001", "iso42001"]],
  ["NIST 800-53", ["nist 800-53", "800-53"]],
  ["NIST 800-171", ["nist 800-171", "800-171"]],
  ["NIST CSF", ["nist csf", "cybersecurity framework"]],
  ["NIST RMF", ["nist rmf", "risk management framework"]],
  ["NIST AI RMF", ["ai rmf", "nist ai rmf"]],
  ["PCI-DSS", ["pci", "pci-dss", "payment card industry"]],
  ["HIPAA", ["hipaa"]],
  ["GDPR", ["gdpr"]],
  ["CCPA", ["ccpa"]],
  ["CMMC", ["cmmc"]],
  ["CJIS", ["cjis"]],
  ["HITRUST", ["hitrust"]]
];

const LANGUAGE_RULES = [
  ["Python", ["python"]],
  ["Terraform", ["terraform"]],
  ["OPA/Rego", ["rego", "open policy agent", "opa"]],
  ["SQL", ["sql"]],
  ["Bash", ["bash", "shell scripting"]],
  ["JavaScript", ["javascript", "node.js", "nodejs"]],
  ["Go", ["golang", " go ", "go/"]],
  ["PowerShell", ["powershell"]],
  ["OSCAL", ["oscal"]],
  ["Rust", ["rust"]]
];

const SPECIALIZATION_RULES = [
  ["Compliance Automation", ["grc", "compliance", "controls", "control testing", "continuous controls", "audit readiness", "security compliance"]],
  ["Risk Management", ["risk", "risk register", "risk assessment", "third-party risk"]],
  ["Security Governance", ["policy", "governance", "governance risk", "governance, risk", "control framework"]],
  ["Audit & Assurance", ["audit", "assurance", "sox", "evidence collection"]],
  ["Cloud Security", ["aws", "azure", "gcp", "cloud security", "kubernetes", "container security"]],
  ["Identity & Access Management", ["iam", "identity", "access management", "okta", "entra", "sso", "privileged access"]],
  ["Privacy", ["privacy", "data protection", "gdpr", "ccpa"]],
  ["Security Architecture", ["security architecture", "secure design", "threat modeling"]],
  ["Security Operations", ["soc", "security operations", "siem", "detection", "monitoring"]],
  ["Incident Response", ["incident response", "forensics", "breach"]],
  ["Third-Party Risk", ["vendor risk", "third-party risk", "supplier risk"]],
  ["Vulnerability Management", ["vulnerability", "patch management", "exposure management"]],
  ["AI Governance", ["ai governance", "model governance", "responsible ai"]],
  ["Cloud Governance", ["cloud governance", "cloud controls"]],
  ["DevSecOps", ["devsecops", "cicd security", "pipeline security"]],
  ["Forward Deployed Engineering", ["forward deployed", "embedded engineer", "deployment engineer"]]
];

function envFlag(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return !["0", "false", "no"].includes(String(value).toLowerCase());
}

function splitEnv(name) {
  return String(process.env[name] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function configuredBoards(envName, catalogBoards) {
  return [...new Set([...(catalogBoards || []), ...splitEnv(envName)])];
}

function toIsoDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCaseFromSlug(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stripHtml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToMarkdown(value) {
  const headingLevels = {
    h1: "#",
    h2: "##",
    h3: "###",
    h4: "####",
    h5: "#####",
    h6: "######"
  };

  let html = String(value || "");
  if (!html.trim()) return "";

  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const label = stripHtml(text);
      if (!label) return href;
      return `${label} (${href})`;
    });

  Object.entries(headingLevels).forEach(([tag, marker]) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    html = html.replace(regex, (_, text) => `\n\n${marker} ${stripHtml(text)}\n\n`);
  });

  html = html
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${stripHtml(text)}`)
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => `\n> ${stripHtml(text)}\n`)
    .replace(/<(p|div|section|article|header|footer|aside|table|tr|tbody|thead)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _tag, text) => {
      const cleaned = stripHtml(text);
      return cleaned ? `\n\n${cleaned}\n\n` : "\n";
    })
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    // Entity decoding above can reintroduce active HTML; keep Markdown text-only.
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  return html
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeJobType(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "Full-time";
  if (normalized === "FullTime") return "Full-time";
  if (normalized === "PartTime") return "Part-time";
  if (/salaried.*full|full.*time/i.test(normalized)) return "Full-time";
  if (/salaried.*part|part.*time/i.test(normalized)) return "Part-time";
  if (normalized === "SALARIED_FT") return "Full-time";
  if (normalized === "SALARIED_PT") return "Part-time";
  return normalized;
}

function excerpt(value, maxLength) {
  const cleaned = stripHtml(value);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

function collectMatches(text, rules, maxItems) {
  const normalized = " " + String(text || "").toLowerCase() + " ";
  const matches = rules
    .filter((rule) => rule[1].some((keyword) => normalized.includes(String(keyword).toLowerCase())))
    .map((rule) => rule[0]);

  return [...new Set(matches)].slice(0, maxItems || matches.length);
}

function includesAny(text, terms) {
  const normalized = String(text || "").toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function countMatches(text, terms) {
  const normalized = String(text || "").toLowerCase();
  return terms.reduce((count, term) => count + (normalized.includes(term) ? 1 : 0), 0);
}

function looksRelevant(title, text) {
  const titleText = String(title || "").toLowerCase();
  const fullText = [titleText, String(text || "").toLowerCase()].join(" ");
  const blockedTitleTerms = [
    "marketing", "social media", "payroll", "clinical",
    "biology", "nutrition", "civil", "commercial",
    "account executive", "customer success", "deal desk", "sales",
    "content", "psychologist", "scientist", "intern",
    "recruiter", "talent", "legal counsel"
  ];
  const directRolelessSignals = [
    "grc",
    "governance, risk & compliance",
    "governance, risk and compliance",
    "governance risk & compliance",
    "governance risk and compliance",
    "governance risk compliance",
    "security compliance",
    "security & compliance",
    "security and compliance",
    "security risk & compliance",
    "security risk and compliance",
    "risk & compliance automation",
    "risk and compliance automation",
    "compliance automation",
    "fedramp",
    "rmf",
    "it governance",
    "governance and trust",
    "trust and compliance",
    "it grc",
    "grc platform",
    "grc platforms",
    "grc system",
    "grc systems",
    "grc automation"
  ];
  const directTechnicalSignals = [
    "compliance engineer",
    "compliance analyst",
    "compliance specialist",
    "compliance lead",
    "compliance developer",
    "security compliance engineer",
    "security compliance analyst",
    "security compliance specialist",
    "security compliance lead",
    "security and compliance engineer",
    "security and compliance analyst",
    "security and compliance lead",
    "security & compliance engineer",
    "security & compliance analyst",
    "security & compliance lead",
    "risk and compliance engineer",
    "risk and compliance analyst",
    "risk & compliance engineer",
    "risk & compliance analyst",
    "technical risk and compliance engineer",
    "cloud security grc",
    "fedramp cloud security",
    "rmf cybersecurity analyst",
    "controls monitoring analyst",
    "it governance analyst",
    "forward deployed engineer",
    "forward deployed"
  ];
  const adjacentSecuritySignals = [
    "security risk",
    "cyber risk",
    "security governance",
    "security trust",
    "governance and trust",
    "programs & controls",
    "programs and controls",
    "security controls",
    "controls monitoring",
    "controls assurance",
    "technology risk",
    "it risk",
    "privacy compliance",
    "privacy engineering",
    "fedramp program",
    "forward deployed"
  ];
  const grcContextTerms = [
    "grc", "governance", "risk", "compliance", "control",
    "controls", "control monitoring", "continuous controls",
    "control validation", "evidence", "evidence collection",
    "evidence automation", "audit", "audit readiness",
    "risk assessment", "risk register", "risk management",
    "policy", "policies", "procedures", "security assurance",
    "customer security assurance", "third-party risk",
    "vendor risk", "least privilege", "identity governance",
    "iam", "access review", "privacy", "fedramp", "soc 2",
    "soc2", "iso 27001", "iso27001", "hitrust", "tisax",
    "nist", "rmf", "800-53", "800-171", "cmmc", "pci",
    "hipaa", "gdpr", "ccpa", "continuous compliance",
    "automation", "control automation", "compliance as code",
    "drata", "vanta", "viso trust", "oscal", "python",
    "powershell", "snowflake", "databricks", "api",
    "forward deployed"
  ];
  const frameworkTerms = [
    "fedramp", "soc 2", "soc2", "iso 27001", "iso27001",
    "hitrust", "nist", "rmf", "800-53", "800-171",
    "cmmc", "pci", "hipaa", "gdpr", "ccpa", "tisax"
  ];
  const automationTerms = [
    "automation", "continuous compliance", "control automation",
    "evidence automation", "compliance as code", "api",
    "python", "powershell", "snowflake", "databricks", "oscal"
  ];

  if (includesAny(titleText, blockedTitleTerms)) return false;

  const hasDirectRolelessSignal = includesAny(titleText, directRolelessSignals);
  const hasDirectTechnicalSignal = includesAny(titleText, directTechnicalSignals);
  const hasAdjacentSecuritySignal = includesAny(titleText, adjacentSecuritySignals);

  if (!hasDirectRolelessSignal && !hasDirectTechnicalSignal && !hasAdjacentSecuritySignal) return false;

  const grcSignals = countMatches(fullText, grcContextTerms);
  const frameworkSignals = countMatches(fullText, frameworkTerms);
  const automationSignals = countMatches(fullText, automationTerms);

  if (hasDirectTechnicalSignal) {
    return grcSignals >= 2;
  }

  if (hasAdjacentSecuritySignal) {
    return grcSignals >= 4 || (grcSignals >= 3 && (frameworkSignals >= 1 || automationSignals >= 1));
  }

  return grcSignals >= 3 || (grcSignals >= 2 && (frameworkSignals >= 1 || automationSignals >= 1));
}

function titleMayBeRelevant(title) {
  const t = String(title || "").toLowerCase();
  const blockedTitleTerms = [
    "marketing", "social media", "payroll", "clinical",
    "biology", "nutrition", "civil", "commercial",
    "account executive", "customer success", "deal desk", "sales",
    "content", "psychologist", "scientist", "intern",
    "recruiter", "talent", "legal counsel"
  ];
  if (includesAny(t, blockedTitleTerms)) return false;
  const signals = [
    "grc", "governance", "compliance", "fedramp", "rmf",
    "risk management", "risk & compliance", "risk and compliance",
    "security compliance", "security & compliance", "security and compliance",
    "compliance automation", "it governance", "trust and compliance",
    "compliance engineer", "compliance analyst", "compliance specialist",
    "compliance lead", "compliance manager", "compliance developer",
    "controls monitoring", "controls assurance",
    "security risk", "cyber risk", "security governance",
    "security trust", "security controls", "technology risk",
    "it risk", "privacy compliance", "privacy engineering",
    "assessor", "cmmc", "audit", "vendor risk", "third-party risk",
    "security assurance", "nist", "soc 2", "soc2", "iso 27001", "hipaa",
    "forward deployed", "forward deployed engineer"
  ];
  return includesAny(t, signals);
}

// Imported descriptions are untrusted. Eleventy evaluates Nunjucks syntax in
// Markdown files, so neutralize opening delimiters before writing any field.
function escapeTemplateSyntax(value) {
  return String(value || "")
    .replace(/</g, "&lt;")
    .replace(/\{\{/g, "&#123;&#123;")
    .replace(/\{%/g, "&#123;%")
    .replace(/\{#/g, "&#123;#");
}

function yamlString(value) {
  return JSON.stringify(escapeTemplateSyntax(value));
}

function yamlList(key, values) {
  if (!values || !values.length) return key + ": []";
  return key + ":\n" + values.map((value) => "  - " + yamlString(value)).join("\n");
}

function formatCompensation(min, max, currency) {
  if (!min && !max) return "";
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  });

  const minValue = min ? fmt.format(min) : "";
  const maxValue = max ? fmt.format(max) : "";
  if (minValue && maxValue) return minValue + " - " + maxValue;
  return minValue || maxValue;
}

function extractCompensation(text) {
  const plain = stripHtml(text);
  // Match: $NNN,NNN(.NN) or $NNNk, optional currency, separator, then same pattern
  const pattern = /\$\s*([\d,]+(?:\.\d{1,2})?)\s*([kK])?\s*(?:USD|CAD|EUR|GBP)?\s*(?:-|–|—|\bto\b|\band\b)\s*\$\s*([\d,]+(?:\.\d{1,2})?)\s*([kK])?\s*(?:USD|CAD|EUR|GBP)?/;
  const match = plain.match(pattern);
  if (!match) return "";

  let min = parseFloat(match[1].replace(/,/g, ""));
  let max = parseFloat(match[3].replace(/,/g, ""));
  if (match[2]) min *= 1000;
  if (match[4]) max *= 1000;

  if (min < 20000 || max < 20000 || max > 2000000) return "";
  if (max < min) return "";

  const currencyMatch = plain.slice(match.index, match.index + match[0].length + 20).match(/\b(CAD|EUR|GBP)\b/);
  const currency = currencyMatch ? currencyMatch[1] : "USD";

  return formatCompensation(min, max, currency);
}

function serializeJob(job) {
  const frontmatter = [
    "---",
    "title: " + yamlString(job.title),
    "company: " + yamlString(job.company),
    "slug: " + yamlString(job.slug),
    "status: " + yamlString(job.status || "published"),
    "source: " + yamlString(job.source),
    yamlList("sources", job.sources || [job.source]),
    "source_url: " + yamlString(job.source_url),
    "role_url: " + yamlString(job.role_url || job.apply_url),
    "apply_url: " + yamlString(job.apply_url),
    "posted_date: " + yamlString(job.posted_date),
    "expires_date: " + yamlString(job.expires_date),
    "location: " + yamlString(job.location),
    yamlList("work_modes", job.work_modes),
    yamlList("job_types", job.job_types),
    yamlList("specializations", job.specializations),
    yamlList("frameworks", job.frameworks),
    yamlList("languages", job.languages),
    "compensation: " + yamlString(job.compensation || ""),
    "summary: " + yamlString(job.summary || ""),
    "---",
    "",
    escapeTemplateSyntax(job.body || "No description was provided by the upstream source.")
  ];

  return frontmatter.join("\n") + "\n";
}

async function fetchJson(url, headers) {
  const response = await fetch(url, {
    headers: Object.assign({ "User-Agent": USER_AGENT }, headers || {})
  });

  if (!response.ok) {
    throw new Error("Request failed: " + response.status + " " + response.statusText + " for " + url);
  }

  return response.json();
}

async function resetDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function writeImportedJobs(sourceKey, jobs) {
  const dir = path.join(IMPORT_ROOT, sourceKey);
  await resetDir(dir);

  for (const job of jobs) {
    const filePath = path.join(dir, job.slug + ".md");
    await fs.writeFile(filePath, serializeJob(job), "utf8");
  }
}

function buildNormalizedJob(job) {
  const content = [job.title, job.company, job.location, job.summary, job.body].join(" ");
  const specializations = job.specializations && job.specializations.length
    ? job.specializations
    : collectMatches(content, SPECIALIZATION_RULES, 4);
  const frameworks = collectMatches(content, FRAMEWORK_RULES, 5);
  const languages = collectMatches(content, LANGUAGE_RULES, 5);

  const compensation = job.compensation || extractCompensation(job.body || "");

  return Object.assign({}, job, {
    specializations,
    frameworks,
    languages,
    compensation,
    summary: excerpt(job.summary || job.body || "", 180)
  });
}

function normalizeRemoteOkJob(job) {
  const body = htmlToMarkdown(job.description || "");
  const summary = stripHtml(job.description || "");
  const text = [job.position, job.company, body, (job.tags || []).join(" ")].join(" ");
  if (!looksRelevant(job.position, text)) return null;

  const postedDate = toIsoDate(job.date || job.date_iso || Date.now());
  const slug = slugify(["remoteok", job.company, job.position].join("-"));
  if (!slug) return null;

  return buildNormalizedJob({
    title: job.position,
    company: job.company || "Unknown company",
    slug,
    source: "Remote OK",
    sources: ["Remote OK"],
    source_url: "https://remoteok.com/json",
    role_url: job.url || job.apply_url || "",
    apply_url: job.apply_url || job.url || "",
    posted_date: postedDate,
    expires_date: addDays(postedDate, 30),
    location: job.location || "Remote",
    work_modes: ["Remote"],
    job_types: [normalizeJobType(job.employment_type)],
    compensation: formatCompensation(job.salary_min, job.salary_max, "USD"),
    summary,
    body: body
  });
}

function normalizeGreenhouseJob(boardToken, job) {
  const body = htmlToMarkdown(job.content || "");
  const summary = stripHtml(job.content || "");
  const text = [job.title, summary, job.location && job.location.name, boardToken].join(" ");
  if (!looksRelevant(job.title, text)) return null;

  const postedDate = toIsoDate(job.updated_at);
  const slug = slugify(["greenhouse", boardToken, job.id, job.title].join("-"));

  return buildNormalizedJob({
    title: job.title,
    company: titleCaseFromSlug(boardToken),
    slug,
    source: "Greenhouse",
    sources: ["Greenhouse"],
    source_url: "https://boards-api.greenhouse.io/v1/boards/" + boardToken + "/jobs?content=true",
    role_url: job.absolute_url || "",
    apply_url: job.absolute_url || "",
    posted_date: postedDate,
    expires_date: addDays(postedDate, 30),
    location: (job.location && job.location.name) || "Remote",
    work_modes: /remote/i.test(summary + " " + ((job.location && job.location.name) || "")) ? ["Remote"] : ["Hybrid / On-site"],
    job_types: ["Full-time"],
    summary,
    body: body
  });
}

function normalizeAshbyJob(boardName, job) {
  const rawDescription = job.descriptionHtml || job.descriptionPlain || "";
  const description = htmlToMarkdown(rawDescription);
  const summary = stripHtml(rawDescription);
  const text = [job.title, job.jobTitle, job.location, summary, boardName].join(" ");
  if (!looksRelevant(job.title || job.jobTitle, text)) return null;

  const postedDate = toIsoDate(job.publishedDate || job.updatedAt || Date.now());
  const slug = slugify(["ashby", boardName, job.id || job.jobId || job.title].join("-"));
  const location = job.location || (job.primaryLocation && job.primaryLocation.label) || "Remote";

  return buildNormalizedJob({
    title: job.title || job.jobTitle,
    company: titleCaseFromSlug(boardName),
    slug,
    source: "Ashby",
    sources: ["Ashby"],
    source_url: "https://api.ashbyhq.com/posting-api/job-board/" + boardName + "?includeCompensation=true",
    role_url: job.jobUrl || job.absoluteUrl || "",
    apply_url: job.applyUrl || job.jobUrl || job.absoluteUrl || "",
    posted_date: postedDate,
    expires_date: addDays(postedDate, 30),
    location,
    work_modes: /remote/i.test([location, summary].join(" ")) ? ["Remote"] : ["Hybrid / On-site"],
    job_types: [normalizeJobType(job.employmentType)],
    compensation: job.compensation && job.compensation.summary ? job.compensation.summary : "",
    summary,
    body: description
  });
}

function safeHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch (_error) {
    return "";
  }
}

function canonicalizeApplyUrl(value) {
  const raw = safeHttpUrl(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const trackingParameters = /^(?:utm_.+|ref|referrer|source|src|gh_src|lever-source|tracking|trk)$/i;
    [...url.searchParams.keys()].forEach(function(key) {
      if (trackingParameters.test(key)) url.searchParams.delete(key);
    });
    url.searchParams.sort();
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch (_error) {
    return "";
  }
}

function extractApplyUrlFromJobFile(content) {
  const frontmatter = String(content || "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return "";

  const match = frontmatter[1].match(/^apply_url:\s*(.+)$/m);
  if (!match) return "";

  let value = match[1].trim();
  try {
    value = JSON.parse(value);
  } catch (_error) {
    value = value.replace(/^['"]|['"]$/g, "");
  }
  return canonicalizeApplyUrl(value);
}

function mergeSpeedrunCandidates(payloads) {
  const candidates = [];
  const seen = new Set();

  (payloads || []).forEach(function(payload) {
    const jobs = payload && Array.isArray(payload.jobs) ? payload.jobs : [];
    jobs.forEach(function(job) {
      const id = String(job && job.id || "");
      if (!id || seen.has(id) || !titleMayBeRelevant(job.title)) return;
      seen.add(id);
      candidates.push(job);
    });
  });

  return candidates;
}

function speedrunLooksRelevant(title, text) {
  const titleText = String(title || "").toLowerCase();
  const fullText = String(text || "").toLowerCase();
  const nonGrcTitleTerms = [
    "cost accounting", "blockchain compliance", "import compliance",
    "export compliance", "trade compliance", "marine compliance",
    "aviation compliance", "product compliance", "quality compliance",
    "tax compliance", "environmental compliance", "safety compliance",
    "regulatory affairs", "kyc", "aml", "anti-money laundering"
  ];
  if (includesAny(titleText, nonGrcTitleTerms)) return false;
  if (!looksRelevant(title, text)) return false;

  const technicalTitleSignals = [
    "grc", "security compliance", "security & compliance",
    "security and compliance", "security governance", "technology risk",
    "cyber risk", "privacy engineering", "privacy compliance",
    "controls assurance", "security assurance", "third-party risk",
    "vendor risk", "risk and compliance", "risk & compliance",
    "it compliance", "compliance automation", "fedramp", "cmmc"
  ];
  const technicalContentPhrases = [
    "governance, risk", "governance risk",
    "information security", "cybersecurity", "security program",
    "security compliance", "security controls", "third-party risk",
    "vendor risk", "customer trust", "trust center", "audit evidence",
    "evidence collection", "identity and access", "identity & access"
  ];
  const frameworkOrToolSignal = /\b(?:grc|nist|fedramp|cmmc|hipaa|gdpr|drata|vanta)\b|\bsoc\s*2\b|\biso\s*27001\b|\bpci(?:\s|-)?dss\b/i;

  return includesAny(titleText, technicalTitleSignals)
    || includesAny(fullText, technicalContentPhrases)
    || frameworkOrToolSignal.test(fullText);
}

function normalizeSpeedrunJob(listing, detail) {
  const data = detail || {};
  if (data.status && data.status !== "open") return null;

  const title = data.title || listing.title;
  const company = data.company || listing.company || "Unknown company";
  const location = data.location || listing.location || "Remote";
  const rawDescription = data.description_text || "";
  const body = htmlToMarkdown(rawDescription);
  const text = [title, company, location, body].join(" ");
  if (!speedrunLooksRelevant(title, text)) return null;

  const id = String(data.id || listing.id || "");
  const postedDate = toIsoDate(data.published_at || listing.published_at || Date.now());
  const roleUrl = safeHttpUrl(listing.url)
    || safeHttpUrl(data.url)
    || safeHttpUrl(data.apply && data.apply.url);
  if (!roleUrl) return null;
  const slug = slugify(["speedrun", company, id.slice(0, 8), title].join("-")).slice(0, 120);
  if (!slug) return null;

  return buildNormalizedJob({
    title,
    company,
    slug,
    source: "a16z Speedrun",
    sources: ["a16z Speedrun"],
    source_url: "https://speedrun-talent-network.com/api/v1/jobs",
    role_url: roleUrl,
    apply_url: roleUrl,
    posted_date: postedDate,
    expires_date: addDays(postedDate, 30),
    location,
    work_modes: (data.remote || listing.remote || /remote/i.test(String(data.workplace_type || listing.workplace_type || "")))
      ? ["Remote"]
      : ["Hybrid / On-site"],
    job_types: [normalizeJobType(data.employment_type || listing.employment_type)],
    compensation: data.comp_summary || formatCompensation(data.comp_min, data.comp_max, data.comp_currency || "USD"),
    summary: rawDescription,
    body
  });
}

const SPEEDRUN_API_BASE = "https://speedrun-talent-network.com/api/v1";
const SPEEDRUN_SEARCH_TERMS = [
  "compliance",
  "grc",
  "security governance",
  "technology risk",
  "third-party risk",
  "vendor risk",
  "security assurance",
  "privacy engineering",
  "fedramp",
  "cmmc",
  "controls assurance"
];

async function collectSpeedrunJobs(fetcher, options) {
  const settings = options || {};
  const searchTerms = settings.searchTerms || SPEEDRUN_SEARCH_TERMS;
  const pagesPerTerm = settings.pagesPerTerm || 2;
  const existingApplyUrls = settings.existingApplyUrls || new Set();
  const seenApplyUrls = new Set(existingApplyUrls);
  const searchRequests = [];
  searchTerms.forEach(function(term) {
    for (let page = 0; page < pagesPerTerm; page++) {
      const url = new URL(SPEEDRUN_API_BASE + "/jobs");
      url.searchParams.set("q", term);
      url.searchParams.set("sort", "rel");
      url.searchParams.set("page", String(page));
      url.searchParams.set("source", "grcengclub");
      searchRequests.push(url.toString());
    }
  });
  const payloads = (await Promise.all(searchRequests.map(function(url) {
    return fetcher(url).catch(function(error) {
      console.warn("[speedrun] failed search " + url + ": " + error.message);
      return null;
    });
  }))).filter(Boolean);
  if (searchRequests.length && payloads.length === 0) {
    throw new Error("All Speedrun search requests failed");
  }
  const candidates = mergeSpeedrunCandidates(payloads);
  const imported = [];
  const batchSize = 8;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const details = await Promise.all(batch.map(function(listing) {
      const detailUrl = SPEEDRUN_API_BASE + "/jobs/" + encodeURIComponent(listing.id) + "?source=grcengclub";
      return fetcher(detailUrl).catch(function(error) {
        console.warn("[speedrun] failed to fetch detail for " + listing.id + ": " + error.message);
        return null;
      });
    }));

    details.forEach(function(payload, index) {
      if (!payload || !payload.job) return;
      const detail = payload.job;
      const upstreamApplyUrl = canonicalizeApplyUrl(detail.apply && detail.apply.url);
      if (upstreamApplyUrl && seenApplyUrls.has(upstreamApplyUrl)) return;
      const normalized = normalizeSpeedrunJob(batch[index], detail);
      if (normalized) {
        imported.push(normalized);
        if (upstreamApplyUrl) seenApplyUrls.add(upstreamApplyUrl);
      }
    });
  }

  return imported;
}

async function importSpeedrun() {
  const existingApplyUrls = new Set();
  let entries = [];
  try {
    entries = await fs.readdir(IMPORT_ROOT, { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const files = entries.filter(function(entry) {
    const normalized = String(entry).replace(/\\/g, "/");
    return normalized.endsWith(".md") && !normalized.startsWith("speedrun/");
  });
  const contents = await Promise.all(files.map(function(entry) {
    return fs.readFile(path.join(IMPORT_ROOT, entry), "utf8");
  }));
  contents.forEach(function(content) {
    const applyUrl = extractApplyUrlFromJobFile(content);
    if (applyUrl) existingApplyUrls.add(applyUrl);
  });

  const jobs = await collectSpeedrunJobs(fetchJson, { existingApplyUrls });
  console.log("[speedrun] filtered against " + existingApplyUrls.size + " existing apply URLs");
  return jobs;
}

async function importRemoteOk() {
  const payload = await fetchJson("https://remoteok.com/json");
  const entries = Array.isArray(payload) ? payload.slice(1) : [];
  return entries.map(normalizeRemoteOkJob).filter(Boolean);
}

async function importGreenhouse() {
  const boards = configuredBoards("GREENHOUSE_BOARDS", catalogGreenhouseBoards);
  if (!boards.length) return [];

  const imported = [];
  for (const board of boards) {
    try {
      const payload = await fetchJson("https://boards-api.greenhouse.io/v1/boards/" + encodeURIComponent(board) + "/jobs?content=true");
      const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
      jobs.forEach((job) => {
        const normalized = normalizeGreenhouseJob(board, job);
        if (normalized) imported.push(normalized);
      });
    } catch (error) {
      console.warn("[greenhouse] skipped board " + board + ": " + (error.message || error));
    }
  }

  return imported;
}

async function importAshby() {
  const boards = configuredBoards("ASHBY_JOB_BOARDS", catalogAshbyBoards);
  if (!boards.length) return [];

  const imported = [];
  for (const board of boards) {
    try {
      const payload = await fetchJson("https://api.ashbyhq.com/posting-api/job-board/" + encodeURIComponent(board) + "?includeCompensation=true");
      const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
      jobs.forEach((job) => {
        const normalized = normalizeAshbyJob(board, job);
        if (normalized) imported.push(normalized);
      });
    } catch (error) {
      console.warn("[ashby] skipped board " + board + ": " + (error.message || error));
    }
  }

  return imported;
}

function normalizeWorkableJob(boardSlug, job) {
  const body = htmlToMarkdown(job.description || "");
  const summary = stripHtml(job.description || "");
  const locationParts = [job.city, job.state, job.country].filter(Boolean);
  const location = locationParts.join(", ") || "Remote";
  const text = [job.title, boardSlug, location, summary].join(" ");
  if (!looksRelevant(job.title, text)) return null;

  const postedDate = toIsoDate(job.published_on || job.created_at);
  const slug = slugify(["workable", boardSlug, job.shortcode, job.title].join("-"));

  return buildNormalizedJob({
    title: job.title,
    company: titleCaseFromSlug(boardSlug),
    slug,
    source: "Workable",
    sources: ["Workable"],
    source_url: "https://apply.workable.com/" + boardSlug,
    role_url: job.url || "",
    apply_url: job.application_url || job.url || "",
    posted_date: postedDate,
    expires_date: addDays(postedDate, 30),
    location,
    work_modes: job.telecommuting ? ["Remote"] : /remote/i.test(location + " " + summary) ? ["Remote"] : ["Hybrid / On-site"],
    job_types: [normalizeJobType(job.employment_type)],
    summary,
    body
  });
}

async function importWorkable() {
  const boards = configuredBoards("WORKABLE_BOARDS", catalogWorkableBoards);
  if (!boards.length) return [];

  const imported = [];
  for (const board of boards) {
    try {
      const payload = await fetchJson("https://www.workable.com/api/accounts/" + encodeURIComponent(board) + "?details=true");
      const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
      jobs.forEach((job) => {
        const normalized = normalizeWorkableJob(board, job);
        if (normalized) imported.push(normalized);
      });
    } catch (error) {
      console.warn("[workable] skipped board " + board + ": " + (error.message || error));
    }
  }

  return imported;
}

function normalizeLeverJob(boardSlug, job) {
  const bodyParts = [job.descriptionBody || job.description || "", job.opening || ""];
  if (Array.isArray(job.lists)) {
    job.lists.forEach((list) => {
      bodyParts.push("<h3>" + (list.text || "") + "</h3>");
      bodyParts.push((list.content || ""));
    });
  }
  bodyParts.push(job.additional || "");
  const rawHtml = bodyParts.join("\n");
  const body = htmlToMarkdown(rawHtml);
  const summary = stripHtml(rawHtml);
  const location = (job.categories && job.categories.location) || job.country || "Remote";
  const text = [job.text, boardSlug, location, summary].join(" ");
  if (!looksRelevant(job.text, text)) return null;

  const postedDate = toIsoDate(job.createdAt);
  const slug = slugify(["lever", boardSlug, job.id, job.text].join("-")).slice(0, 120);

  const compensation = job.salaryRange
    ? formatCompensation(job.salaryRange.min, job.salaryRange.max, job.salaryRange.currency)
    : "";

  return buildNormalizedJob({
    title: job.text,
    company: titleCaseFromSlug(boardSlug),
    slug,
    source: "Lever",
    sources: ["Lever"],
    source_url: "https://jobs.lever.co/" + boardSlug,
    role_url: job.hostedUrl || "",
    apply_url: job.applyUrl || job.hostedUrl || "",
    posted_date: postedDate,
    expires_date: addDays(postedDate, 30),
    location,
    work_modes: (job.workplaceType === "remote" || /remote/i.test(location + " " + ((job.categories && job.categories.commitment) || "")))
      ? ["Remote"]
      : ["Hybrid / On-site"],
    job_types: [normalizeJobType((job.categories && job.categories.commitment) || "")],
    compensation,
    summary,
    body
  });
}

async function fetchLeverJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT }
  });
  if (!response.ok) {
    throw new Error("Request failed: " + response.status + " " + response.statusText + " for " + url);
  }
  const text = await response.text();
  const cleaned = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
  return JSON.parse(cleaned);
}

async function importLever() {
  const boards = configuredBoards("LEVER_BOARDS", catalogLeverBoards);
  if (!boards.length) return [];

  const imported = [];
  for (const board of boards) {
    try {
      const data = await fetchLeverJson("https://api.lever.co/v0/postings/" + encodeURIComponent(board) + "?mode=json");
      const jobs = Array.isArray(data) ? data : [];
      jobs.forEach((job) => {
        const normalized = normalizeLeverJob(board, job);
        if (normalized) imported.push(normalized);
      });
    } catch (error) {
      console.warn("[lever] skipped board " + board + ": " + (error.message || error));
    }
  }

  return imported;
}

function normalizeRipplingJob(boardSlug, detail) {
  const descParts = [];
  if (detail.description) {
    if (typeof detail.description === "string") {
      descParts.push(detail.description);
    } else {
      if (detail.description.company) descParts.push(detail.description.company);
      if (detail.description.role) descParts.push(detail.description.role);
    }
  }
  const rawHtml = descParts.join("\n");
  const body = htmlToMarkdown(rawHtml);
  const summary = stripHtml(rawHtml);

  const location = Array.isArray(detail.workLocations) && detail.workLocations.length
    ? detail.workLocations.join(" | ")
    : "Remote";

  const text = [detail.name, boardSlug, location, summary].join(" ");
  if (!looksRelevant(detail.name, text)) return null;

  const postedDate = toIsoDate(detail.createdOn);
  const slug = slugify(["rippling", boardSlug, detail.uuid, detail.name].join("-")).slice(0, 120);

  let compensation = "";
  if (Array.isArray(detail.payRangeDetails) && detail.payRangeDetails.length) {
    const range = detail.payRangeDetails.find(function(r) { return r.isRemote; })
      || detail.payRangeDetails[0];
    if (range.rangeStart || range.rangeEnd) {
      compensation = formatCompensation(range.rangeStart, range.rangeEnd, range.currency || "USD");
    }
  }

  const empType = (detail.employmentType && (detail.employmentType.id || detail.employmentType.label)) || "";
  const company = detail.companyName || titleCaseFromSlug(boardSlug);

  return buildNormalizedJob({
    title: detail.name,
    company,
    slug,
    source: "Rippling",
    sources: ["Rippling"],
    source_url: "https://ats.rippling.com/" + boardSlug + "/jobs",
    role_url: detail.url || "",
    apply_url: detail.url || "",
    posted_date: postedDate,
    expires_date: addDays(postedDate, 30),
    location,
    work_modes: /remote/i.test(location + " " + summary) ? ["Remote"] : ["Hybrid / On-site"],
    job_types: [normalizeJobType(empType)],
    compensation,
    summary,
    body
  });
}

async function importRippling() {
  const boards = configuredBoards("RIPPLING_BOARDS", catalogRipplingBoards);
  if (!boards.length) return [];

  const imported = [];
  for (const board of boards) {
    try {
      const allJobs = [];
      let offset = 0;
      const limit = 100;
      const maxPages = 10;
      for (let page = 0; page < maxPages; page++) {
        const url = "https://api.rippling.com/platform/api/ats/v1/board/"
          + encodeURIComponent(board) + "/jobs?limit=" + limit + "&offset=" + offset;
        const result = await fetchJson(url);
        const jobs = Array.isArray(result) ? result : [];
        allJobs.push(...jobs);
        if (jobs.length < limit) break;
        offset += limit;
      }

      const candidates = allJobs.filter(function(job) {
        return titleMayBeRelevant(job.name);
      });
      console.log("[rippling] " + board + ": " + allJobs.length + " listed, "
        + candidates.length + " passed pre-filter");

      const BATCH_SIZE = 5;
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        const details = await Promise.all(batch.map(function(job) {
          const detailUrl = "https://api.rippling.com/platform/api/ats/v1/board/"
            + encodeURIComponent(board) + "/jobs/" + encodeURIComponent(job.uuid);
          return fetchJson(detailUrl).catch(function(err) {
            console.warn("[rippling] failed to fetch detail for " + job.uuid + ": " + err.message);
            return null;
          });
        }));

        details.forEach(function(detail) {
          if (!detail) return;
          const normalized = normalizeRipplingJob(board, detail);
          if (normalized) imported.push(normalized);
        });
      }
    } catch (error) {
      console.warn("[rippling] skipped board " + board + ": " + (error.message || error));
    }
  }

  return imported;
}

async function runSource(key, enabled, importer) {
  if (!enabled) {
    console.log("[" + key + "] skipped");
    return 0;
  }

  const jobs = await importer();
  await writeImportedJobs(key, jobs);
  console.log("[" + key + "] wrote " + jobs.length + " jobs");
  return jobs.length;
}

async function main() {
  await fs.mkdir(IMPORT_ROOT, { recursive: true });

  let total = 0;
  total += await runSource("remoteok", envFlag("REMOTEOK_ENABLED", true), importRemoteOk);
  total += await runSource("greenhouse", configuredBoards("GREENHOUSE_BOARDS", catalogGreenhouseBoards).length > 0, importGreenhouse);
  total += await runSource("ashby", configuredBoards("ASHBY_JOB_BOARDS", catalogAshbyBoards).length > 0, importAshby);
  total += await runSource("workable", configuredBoards("WORKABLE_BOARDS", catalogWorkableBoards).length > 0, importWorkable);
  total += await runSource("lever", configuredBoards("LEVER_BOARDS", catalogLeverBoards).length > 0, importLever);
  total += await runSource("rippling", configuredBoards("RIPPLING_BOARDS", catalogRipplingBoards).length > 0, importRippling);
  total += await runSource("speedrun", envFlag("SPEEDRUN_ENABLED", true), importSpeedrun);

  if (total === 0) {
    console.log("No jobs matched the current GRC filters.");
    console.log("Tip: curated ATS boards and the a16z Speedrun API are checked automatically.");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  canonicalizeApplyUrl,
  collectSpeedrunJobs,
  extractApplyUrlFromJobFile,
  extractCompensation,
  htmlToMarkdown,
  importSpeedrun,
  looksRelevant,
  mergeSpeedrunCandidates,
  normalizeSpeedrunJob,
  serializeJob
};
