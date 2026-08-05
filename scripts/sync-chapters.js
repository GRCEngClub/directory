#!/usr/bin/env node
// Regenerate chapters/*.md from the club site's chapters.json (the source of
// truth behind grcengclub.com/chapters). One file per live chapter (leaders
// present); chapter files whose slug is no longer live are removed so renames
// (nairobi -> kenya) don't leave ghosts. _template.md is never touched.
//
// Usage: node scripts/sync-chapters.js path/to/chapters.json
// The sync-chapters workflow downloads chapters.json and runs this daily.

const fs = require("fs");
const path = require("path");

const REGION = {
  "United States": "North America",
  Canada: "North America",
  Germany: "Europe",
  Ireland: "Europe",
  Sweden: "Europe",
  "United Kingdom": "Europe",
  Kenya: "Africa",
  India: "Asia",
  Qatar: "Asia",
  Singapore: "Asia",
  Australia: "Oceania",
};

// Refuse to run on implausibly small input: a truncated or broken download
// must not mass-delete chapter pages.
const MIN_LIVE_CHAPTERS = 15;

function yamlStr(value) {
  const needsQuote =
    value.includes(": ") ||
    value.endsWith(":") ||
    value.includes("#") ||
    "\"'&*?|>%@`[]{}!-".includes(value[0]);
  if (needsQuote) {
    return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }
  return value;
}

function render(ch) {
  const region = REGION[ch.country];
  if (!region) {
    throw new Error(
      `No region mapping for country "${ch.country}" (${ch.slug}) - add it to REGION in scripts/sync-chapters.js`,
    );
  }
  const lines = [
    "---",
    `city: ${yamlStr(ch.city)}`,
    `slug: ${ch.slug}`,
    `status: ${ch.status}`,
    `country: ${yamlStr(ch.country)}`,
    `region: ${region}`,
    `chapter_url: https://grcengclub.com/chapters/${ch.slug}`,
    `meetings: ${yamlStr(ch.meetingCadence || "Meeting schedule coming soon")}`,
    `summary: ${yamlStr(ch.blurb)}`,
    "leads:",
  ];
  for (const lead of ch.leaders) {
    lines.push(`  - name: ${yamlStr(lead.name)}`);
    lines.push(`    role: ${yamlStr(lead.role)}`);
    if (lead.linkedin) lines.push(`    linkedin: ${lead.linkedin}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

function main() {
  const src = process.argv[2];
  if (!src) {
    console.error("Usage: node scripts/sync-chapters.js path/to/chapters.json");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(src, "utf8"));
  const live = data.chapters.filter((c) => c.leaders && c.leaders.length > 0);
  if (live.length < MIN_LIVE_CHAPTERS) {
    console.error(
      `Only ${live.length} live chapters in ${src} - refusing to sync (guard is ${MIN_LIVE_CHAPTERS}).`,
    );
    process.exit(1);
  }

  const chaptersDir = path.join(__dirname, "..", "chapters");
  const liveSlugs = new Set(live.map((c) => c.slug));

  let wrote = 0;
  for (const ch of live) {
    fs.writeFileSync(path.join(chaptersDir, `${ch.slug}.md`), render(ch));
    wrote += 1;
  }

  let removed = 0;
  for (const file of fs.readdirSync(chaptersDir)) {
    if (!file.endsWith(".md") || file.startsWith("_")) continue;
    const slug = file.slice(0, -3);
    if (!liveSlugs.has(slug)) {
      fs.unlinkSync(path.join(chaptersDir, file));
      console.log(`removed stale chapter: ${file}`);
      removed += 1;
    }
  }

  console.log(`synced ${wrote} chapters, removed ${removed}`);
}

main();
