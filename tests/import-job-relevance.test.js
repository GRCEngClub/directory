const test = require("node:test");
const assert = require("node:assert/strict");

const { looksRelevant } = require("../scripts/import-jobs");
const {
  greenhouseBoards,
  ashbyBoards
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
