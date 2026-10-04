const test = require("node:test");
const assert = require("node:assert/strict");

const { looksRelevant, collectReedJobDetails, normalizeReedJob } = require("../scripts/import-jobs");
const {
  greenhouseBoards,
  ashbyBoards,
  workableBoards,
  leverBoards
} = require("../scripts/job-board-sources");

test("looksRelevant accepts FedRAMP authorization specialist titles", () => {
  const title = "Security Authorization Specialist";
  const body = [
    "Lead FedRAMP and DoD authorization packages,",
    "maintain NIST 800-53 controls, collect audit evidence,",
    "and automate compliance workflows with Python, Bash, and SQL."
  ].join(" ");

  assert.equal(looksRelevant(title, body), true);
});

test("looksRelevant still accepts core GRC engineer titles", () => {
  assert.equal(
    looksRelevant(
      "GRC Engineer",
      "Build compliance automation for SOC 2 and ISO 27001 with Python and Terraform."
    ),
    true
  );
});

test("catalog includes high-signal boards from sheet triage gaps", () => {
  assert.ok(greenhouseBoards.includes("charliehealth"));
  assert.ok(greenhouseBoards.includes("ninjatrader"));
  assert.ok(ashbyBoards.includes("Zania"));
  assert.ok(ashbyBoards.includes("antithesis"));
  assert.ok(ashbyBoards.includes("Second-Front-Systems"));
});

test("catalog includes live-verified UK ATS boards", () => {
  assert.ok(ashbyBoards.includes("transficc"));
  assert.ok(ashbyBoards.includes("lemfi"));
  assert.ok(ashbyBoards.includes("Sierra"));
  assert.ok(workableBoards.includes("bridewell"));
  assert.ok(workableBoards.includes("control-risks-6"));
  assert.ok(workableBoards.includes("indra-uk"));
  assert.ok(leverBoards.includes("zopa"));
  assert.ok(leverBoards.includes("farfetch"));
});

test("Reed discovery reads SSR results and preserves board attribution", () => {
  const payload = {
    props: { pageProps: { searchResults: { jobs: [{ jobDetail: {
      jobId: 57394311,
      jobTitle: "GRC Lead",
      jobDescriptionSnippet: "Lead a cyber security GRC function covering ISO 27001, audit evidence, risk, and control automation.",
      ouName: "Example Recruitment",
      displayLocationName: "Preston",
      countyLocation: "Lancashire",
      dateCreated: "2026-09-25T15:20:12.037",
      expiryDate: "2026-11-06T23:55:00",
      salaryFrom: 70000,
      salaryTo: 75000,
      isFullTime: true,
      workingOption: "hybrid"
    }}] } } }
  };
  const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify(payload) + '</script>';
  const details = collectReedJobDetails(html);
  const job = normalizeReedJob(details[0]);

  assert.equal(details.length, 1);
  assert.equal(job.source, "Reed");
  assert.equal(job.apply_url, "https://www.reed.co.uk/jobs/grc-lead/57394311");
  assert.equal(job.compensation, "£70,000 - £75,000");
  assert.deepEqual(job.work_modes, ["Hybrid / On-site"]);
  assert.ok(job.frameworks.includes("ISO 27001"));
});
