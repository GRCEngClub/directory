const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("chapter filters expose the progressive command-palette controls", () => {
  const partial = read("site/_includes/partials/chapter-filter-bar.njk");
  const page = read("site/chapters.njk");

  assert.match(partial, /class="filters-compact-bar"/);
  assert.match(partial, /class="[^"]*filter-command-trigger[^"]*"[^>]*data-filter-toggle/);
  assert.match(partial, /class="filter-shortcut"/);
  assert.match(partial, /data-filter-dismiss/);
  assert.match(partial, /id="filter-panel"/);
  assert.match(partial, /class="[^"]*filter-palette-close[^"]*"[^>]*data-filter-toggle/);
  assert.match(page, /assets\/js\/filter-scroll\.js/);
});

test("chapter search binds to the shared palette input and compact result count", () => {
  const script = read("site/assets/js/chapters-search.js");

  assert.match(script, /getElementById\("search-input"\)/);
  assert.match(script, /querySelector\("\[data-compact-results\]"\)/);
});

test("chapter filters avoid an empty mobile workbench header", () => {
  const partial = read("site/_includes/partials/chapter-filter-bar.njk");

  assert.doesNotMatch(partial, /class="filter-workbench-header"/);
});
