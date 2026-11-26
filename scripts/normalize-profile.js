// Normalizes list values in engineer profile frontmatter so filters and the
// "Browse the directory" lists don't split one skill across spellings.
//
// Text-based on purpose (no YAML dependency) so process-submission.yml can
// require it straight from a checkout. Only list items under the keys below
// are touched; everything else in the file is left byte-for-byte as is.
//
//   node scripts/normalize-profile.js            # report changes
//   node scripts/normalize-profile.js --write    # apply to engineers/*.md

const ALIASES = {
  frameworks: {
    "pci dss": "PCI-DSS"
  },
  certifications: {
    cgep: "CGE-P",
    cysa: "CySA+",
    "aws-ccp": "AWS CCP",
    "microsoft azure az-900": "Microsoft Azure (AZ-900)",
    "security x": "SecurityX",
    "iso42001 la": "ISO 42001 LA",
    "giac foundational cybersecurity technologies, gfact": "GIAC Foundational Cybersecurity Technologies (GFACT)",
    "certified grc engineer, auditor specialty (cge-aud": "Certified GRC Engineer - Auditor Specialty (CGE-AUD)"
  }
};

// Case/spacing-insensitive spellings that collapse to one canonical value.
const LOOSE_KEYS = { "cysa+": "cysa", "cysa +": "cysa" };

// available_for drives filters and URLs, so values are always lowercase.
const LOWERCASE_FIELDS = new Set(["available_for"]);

function canonical(field, value) {
  if (LOWERCASE_FIELDS.has(field)) return value.toLowerCase();
  const aliases = ALIASES[field];
  if (!aliases) return value;
  const key = value.toLowerCase().replace(/\s+/g, " ").trim();
  const loose = LOOSE_KEYS[key] || key;
  return aliases[loose] || value;
}

function normalizeMarkdown(text) {
  const lines = text.split("\n");
  const changes = [];
  let fence = 0;
  let field = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "---") {
      fence++;
      if (fence >= 2) break;
      continue;
    }
    if (fence !== 1) continue;

    const key = line.match(/^([A-Za-z_]+):\s*$/);
    if (key) { field = key[1]; continue; }
    if (/^\S/.test(line)) { field = null; continue; }
    if (!field) continue;

    const item = line.match(/^(\s+-\s+)"((?:[^"\\]|\\.)*)"\s*$/) || line.match(/^(\s+-\s+)([^"'#\s].*?)\s*$/);
    if (!item) continue;
    const before = item[2];
    const after = canonical(field, before);
    if (after !== before) {
      lines[i] = item[1] + '"' + after.replace(/"/g, '\\"') + '"';
      changes.push({ field, from: before, to: after });
    }
  }

  return { text: lines.join("\n"), changes };
}

module.exports = { normalizeMarkdown, canonical };

if (require.main === module) {
  const fs = require("fs");
  const path = require("path");
  const write = process.argv.includes("--write");
  const dir = path.join(__dirname, "..", "engineers");
  let total = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".md") || name.startsWith("_")) continue;
    const file = path.join(dir, name);
    const result = normalizeMarkdown(fs.readFileSync(file, "utf8"));
    if (!result.changes.length) continue;
    total += result.changes.length;
    result.changes.forEach((c) => console.log(name + ": " + c.field + ' "' + c.from + '" -> "' + c.to + '"'));
    if (write) fs.writeFileSync(file, result.text);
  }
  console.log(total + " value(s) " + (write ? "normalized" : "would change"));
}
