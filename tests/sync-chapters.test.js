const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { resolveInputPath } = require("../scripts/sync-chapters");

// Each case builds a throwaway input directory so we exercise the containment
// boundary without touching the real /tmp. resolveInputPath takes the boundary
// as an argument for exactly this reason.
function withScratchDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-chapters-"));
  // Canonicalize so assertions compare against the same path realpath returns
  // (macOS resolves the tmp symlink to /private/...).
  const realDir = fs.realpathSync(dir);
  try {
    fn(realDir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("resolveInputPath accepts a .json file inside the input directory", () => {
  withScratchDir((dir) => {
    fs.writeFileSync(path.join(dir, "chapters.json"), "{}");
    const resolved = resolveInputPath("chapters.json", dir);
    assert.equal(resolved, path.join(dir, "chapters.json"));
  });
});

test("resolveInputPath accepts an absolute path inside the input directory", () => {
  withScratchDir((dir) => {
    const abs = path.join(dir, "chapters.json");
    fs.writeFileSync(abs, "{}");
    assert.equal(resolveInputPath(abs, dir), abs);
  });
});

test("resolveInputPath rejects ../ traversal out of the input directory", () => {
  withScratchDir((dir) => {
    assert.throws(() => resolveInputPath("../escape.json", dir), /inside/);
  });
});

test("resolveInputPath rejects an absolute path outside the input directory", () => {
  withScratchDir((dir) => {
    assert.throws(() => resolveInputPath("/etc/passwd.json", dir), /inside/);
  });
});

test("resolveInputPath rejects a lexical escape that climbs above the directory", () => {
  withScratchDir((dir) => {
    assert.throws(
      () => resolveInputPath("subdir/../../escape.json", dir),
      /inside/,
    );
  });
});

test("resolveInputPath rejects a symlink inside the dir pointing outside", () => {
  withScratchDir((dir) => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "sync-outside-"));
    const target = path.join(outside, "secret.json");
    fs.writeFileSync(target, "{}");
    const link = path.join(dir, "link.json");
    try {
      fs.symlinkSync(target, link);
    } catch {
      // Some environments disallow symlink creation; nothing to assert there.
      fs.rmSync(outside, { recursive: true, force: true });
      return;
    }
    try {
      assert.throws(() => resolveInputPath("link.json", dir), /inside/);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

test("resolveInputPath rejects a non-.json file inside the directory", () => {
  withScratchDir((dir) => {
    fs.writeFileSync(path.join(dir, "chapters.txt"), "{}");
    assert.throws(() => resolveInputPath("chapters.txt", dir), /\.json/);
  });
});
