const test = require("node:test");
const assert = require("node:assert/strict");
const nunjucks = require("nunjucks");

const {
  canonicalizeApplyUrl,
  collectSpeedrunJobs,
  extractApplyUrlFromJobFile,
  htmlToMarkdown,
  mergeSpeedrunCandidates,
  normalizeSpeedrunJob,
  serializeJob
} = require("../scripts/import-jobs");

test("normalizeSpeedrunJob creates an attributed GRC job", () => {
  const listing = {
    id: "81fcada5-9746-4074-bf94-d39c25bbc07a",
    title: "Security & Compliance Operations Manager",
    company: "Mintlify",
    location: "San Francisco",
    employment_type: "FullTime",
    remote: false,
    workplace_type: "OnSite",
    published_at: "2026-07-13T16:58:15.302+00:00",
    url: "https://speedrun-talent-network.com/jobs/security-compliance-operations-manager-mintlify-81fcada5?utm_source=grcengclub&utm_medium=agent"
  };
  const detail = {
    status: "open",
    title: listing.title,
    company: listing.company,
    location: listing.location,
    employment_type: listing.employment_type,
    remote: listing.remote,
    workplace_type: listing.workplace_type,
    published_at: listing.published_at,
    comp_summary: "$120K – $180K",
    apply: {
      kind: "external",
      url: "https://jobs.ashbyhq.com/Mintlify/81fcada5-9746-4074-bf94-d39c25bbc07a/application"
    },
    description_text: "Own the GRC program, SOC 2 Type II, ISO 27001, evidence collection, and compliance automation."
  };

  const job = normalizeSpeedrunJob(listing, detail);

  assert.equal(job.source, "a16z Speedrun");
  assert.equal(job.apply_url, listing.url);
  assert.equal(job.role_url, listing.url);
  assert.equal(job.compensation, "$120K – $180K");
  assert.deepEqual(job.work_modes, ["Hybrid / On-site"]);
  assert.deepEqual(job.job_types, ["Full-time"]);
  assert.ok(job.frameworks.includes("SOC 2"));
  assert.ok(job.frameworks.includes("ISO 27001"));
  assert.ok(job.specializations.includes("Compliance Automation"));
  assert.match(job.slug, /^speedrun-mintlify-81fcada5/);
});

test("normalizeSpeedrunJob rejects non-HTTP application URLs", () => {
  const listing = {
    id: "unsafe-1",
    title: "Security Compliance Engineer",
    company: "Example",
    url: "javascript:alert(document.domain)"
  };
  const detail = {
    status: "open",
    title: listing.title,
    company: listing.company,
    apply: { url: "javascript:alert(document.domain)" },
    description_text: "Security compliance, SOC 2, audit evidence, and control automation."
  };

  assert.equal(normalizeSpeedrunJob(listing, detail), null);
});

test("normalizeSpeedrunJob rejects non-GRC compliance roles", () => {
  const listing = {
    id: "job-2",
    title: "Cost Accounting Compliance Analyst",
    company: "Defense Co",
    location: "California",
    url: "https://speedrun-talent-network.com/jobs/cost-accounting-compliance-analyst-job-2?utm_source=grcengclub&utm_medium=agent"
  };
  const detail = {
    status: "open",
    title: listing.title,
    company: listing.company,
    description_text: "Maintain accounting policies, audit cost submissions, assess financial risk, and ensure contract compliance."
  };

  assert.equal(normalizeSpeedrunJob(listing, detail), null);
});

test("normalizeSpeedrunJob does not match framework names inside ordinary words", () => {
  const listing = {
    id: "job-3",
    title: "Compliance Analyst",
    company: "Finance Co",
    location: "New York",
    url: "https://speedrun-talent-network.com/jobs/compliance-analyst-job-3?utm_source=grcengclub&utm_medium=agent"
  };
  const detail = {
    status: "open",
    title: listing.title,
    company: listing.company,
    description_text: "Administer financial policies and maintain advantageous banking controls."
  };

  assert.equal(normalizeSpeedrunJob(listing, detail), null);
});

test("mergeSpeedrunCandidates keeps relevant unique listings", () => {
  const compliance = {
    id: "job-1",
    title: "Security Compliance Engineer",
    company: "Example"
  };
  const payloads = [
    { jobs: [compliance, { id: "job-2", title: "Head of Marketing", company: "Example" }] },
    { jobs: [compliance, { id: "job-3", title: "Technology Risk Analyst", company: "Example" }] }
  ];

  const candidates = mergeSpeedrunCandidates(payloads);

  assert.deepEqual(candidates.map((job) => job.id), ["job-1", "job-3"]);
});

test("canonicalizeApplyUrl removes tracking without changing the application path", () => {
  const url = "https://Jobs.AshbyHQ.com/Mintlify/job-1/application/?utm_source=test#apply";

  assert.equal(
    canonicalizeApplyUrl(url),
    "https://jobs.ashbyhq.com/Mintlify/job-1/application"
  );
  assert.equal(
    canonicalizeApplyUrl("https://example.com/apply?job=123&utm_source=board"),
    "https://example.com/apply?job=123"
  );
  assert.notEqual(
    canonicalizeApplyUrl("https://example.com/apply?job=123"),
    canonicalizeApplyUrl("https://example.com/apply?job=456")
  );
});

test("collectSpeedrunJobs fetches attributed searches and job details", async () => {
  const listing = {
    id: "job-1",
    title: "Security Compliance Engineer",
    company: "Example",
    location: "Remote",
    remote: true,
    employment_type: "FullTime",
    published_at: "2026-07-30T00:00:00Z",
    url: "https://speedrun-talent-network.com/jobs/security-compliance-engineer-example-job-1?utm_source=grcengclub&utm_medium=agent"
  };
  const detail = {
    id: "job-1",
    status: "open",
    title: listing.title,
    company: listing.company,
    location: listing.location,
    remote: true,
    employment_type: listing.employment_type,
    published_at: listing.published_at,
    apply: { url: "https://example.com/apply/job-1" },
    description_text: "Build security compliance automation for SOC 2 evidence and controls."
  };
  const requests = [];
  const fetcher = async (url) => {
    requests.push(url);
    return url.includes("/jobs?") ? { jobs: [listing] } : { job: detail };
  };

  const jobs = await collectSpeedrunJobs(fetcher, {
    searchTerms: ["security compliance"],
    pagesPerTerm: 1,
    existingApplyUrls: new Set()
  });

  assert.equal(jobs.length, 1);
  assert.match(requests[0], /q=security\+compliance/);
  assert.match(requests[0], /source=grcengclub/);
  assert.match(requests[1], /\/api\/v1\/jobs\/job-1\?source=grcengclub/);
});

test("collectSpeedrunJobs continues when one search page fails", async () => {
  const listing = {
    id: "job-partial",
    title: "Security Compliance Engineer",
    company: "Example",
    location: "Remote",
    remote: true,
    url: "https://speedrun-talent-network.com/jobs/job-partial?utm_source=grcengclub"
  };
  const fetcher = async (url) => {
    if (url.includes("q=broken")) throw new Error("temporary upstream failure");
    if (url.includes("/jobs?")) return { jobs: [listing] };
    return {
      job: {
        ...listing,
        status: "open",
        apply: { url: "https://example.com/apply?job=partial" },
        description_text: "Security compliance automation, SOC 2 controls, and audit evidence."
      }
    };
  };

  const jobs = await collectSpeedrunJobs(fetcher, {
    searchTerms: ["broken", "security compliance"],
    pagesPerTerm: 1
  });

  assert.equal(jobs.length, 1);
});

test("collectSpeedrunJobs requests each configured search page", async () => {
  const requests = [];
  const fetcher = async (url) => {
    requests.push(url);
    return { jobs: [] };
  };

  await collectSpeedrunJobs(fetcher, {
    searchTerms: ["grc"],
    pagesPerTerm: 2
  });

  assert.equal(requests.length, 2);
  assert.match(requests[0], /page=0/);
  assert.match(requests[1], /page=1/);
});

test("collectSpeedrunJobs skips roles already imported from another board", async () => {
  const listing = {
    id: "job-1",
    title: "Security Compliance Engineer",
    company: "Example",
    location: "Remote",
    remote: true,
    url: "https://speedrun-talent-network.com/jobs/security-compliance-engineer-example-job-1?utm_source=grcengclub&utm_medium=agent"
  };
  const detail = {
    id: listing.id,
    status: "open",
    title: listing.title,
    company: listing.company,
    location: listing.location,
    remote: true,
    apply: { url: "https://example.com/apply/job-1?ref=speedrun" },
    description_text: "Security compliance automation, controls, SOC 2, and audit evidence."
  };
  const fetcher = async (url) => url.includes("/jobs?") ? { jobs: [listing] } : { job: detail };

  const jobs = await collectSpeedrunJobs(fetcher, {
    searchTerms: ["security compliance"],
    existingApplyUrls: new Set(["https://example.com/apply/job-1"])
  });

  assert.deepEqual(jobs, []);
});

test("collectSpeedrunJobs deduplicates repeated upstream application URLs in one run", async () => {
  const listings = ["job-1", "job-2"].map((id) => ({
    id,
    title: "Security Compliance Engineer",
    company: "Example",
    location: "Remote",
    remote: true,
    url: `https://speedrun-talent-network.com/jobs/${id}?utm_source=grcengclub`
  }));
  const fetcher = async (url) => {
    if (url.includes("/jobs?")) return { jobs: listings };
    const id = url.includes("job-1") ? "job-1" : "job-2";
    return {
      job: {
        id,
        status: "open",
        title: listings[0].title,
        company: listings[0].company,
        location: "Remote",
        remote: true,
        apply: { url: "https://example.com/apply?job=123&utm_source=speedrun" },
        description_text: "Security compliance automation, SOC 2 controls, and audit evidence."
      }
    };
  };

  const jobs = await collectSpeedrunJobs(fetcher, {
    searchTerms: ["security compliance"],
    pagesPerTerm: 1
  });

  assert.equal(jobs.length, 1);
});

test("extractApplyUrlFromJobFile reads generated frontmatter safely", () => {
  const markdown = [
    "---",
    "title: \"Security Compliance Engineer\"",
    "apply_url: \"https://example.com/apply/job-1?utm_source=board\"",
    "---",
    "Description"
  ].join("\n");

  assert.equal(
    extractApplyUrlFromJobFile(markdown),
    "https://example.com/apply/job-1"
  );

  const poisonedBodyOnly = [
    "---",
    "title: \"Security Compliance Engineer\"",
    "---",
    "Description",
    "apply_url: \"https://example.com/poison\""
  ].join("\n");
  assert.equal(extractApplyUrlFromJobFile(poisonedBodyOnly), "");
});

test("htmlToMarkdown neutralizes encoded HTML that could become active markup", () => {
  const markdown = htmlToMarkdown(
    "Security role &lt;img src=x onerror=alert(1)&gt; &lt;script&gt;alert(2)&lt;/script&gt;"
  );

  assert.doesNotMatch(markdown, /<img|<script/i);
  assert.match(markdown, /&lt;img/);
  assert.match(markdown, /&lt;script/);
});

test("serializeJob neutralizes Nunjucks syntax from untrusted job data", () => {
  const job = {
    title: "Security {{ 7 * 7 }} Engineer </script><script>alert(1)</script>",
    company: "{% include \"package.json\" %}",
    slug: "security-engineer",
    source: "a16z Speedrun",
    sources: ["a16z Speedrun"],
    source_url: "https://speedrun-talent-network.com/api/v1/jobs",
    role_url: "https://speedrun-talent-network.com/jobs/job-1",
    apply_url: "https://speedrun-talent-network.com/jobs/job-1",
    posted_date: "2026-07-30",
    expires_date: "2026-08-29",
    location: "Remote",
    work_modes: ["Remote"],
    job_types: ["Full-time"],
    specializations: ["Security Governance"],
    frameworks: [],
    languages: [],
    compensation: "",
    summary: "{{ 7 * 7 }}",
    body: "{% include \"package.json\" %}\n{# untrusted comment #}\n{{{\n{{#\n{#{"
  };

  const markdown = serializeJob(job);

  assert.doesNotMatch(markdown, /\{\{|\{%|\{#/);
  assert.doesNotMatch(markdown, /<\/script/i);
  assert.match(markdown, /&#123;&#123; 7 \* 7 }}/);
  assert.match(markdown, /&lt;\/script>/i);
  assert.match(markdown, /&#123;% include/);
  assert.match(markdown, /&#123;# untrusted comment/);

  const serializedTitle = markdown.match(/^title: (.+)$/m)[1];
  const renderedJsonLd = nunjucks.renderString(
    "<script>{{ title | dump | safe }}</script>",
    { title: JSON.parse(serializedTitle) }
  );
  assert.equal((renderedJsonLd.match(/<\/script>/gi) || []).length, 1);
  assert.doesNotMatch(renderedJsonLd, /<\/script><script>/i);
});
