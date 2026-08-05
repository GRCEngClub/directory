const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function workflowScript() {
  const workflow = source('.github/workflows/process-submission.yml');
  const marker = '          script: |\n';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, 'workflow script block must exist');
  return workflow
    .slice(start + marker.length)
    .split('\n')
    .map(function (line) {
      return line.startsWith('            ') ? line.slice(12) : line;
    })
    .join('\n');
}

async function runWorkflow(issue, github) {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const execute = new AsyncFunction('github', 'context', workflowScript());
  await execute(github, {
    payload: { issue },
    repo: { owner: 'GRCEngClub', repo: 'directory' }
  });
}

test('submission workflow accepts new profiles only', function () {
  const workflow = source('.github/workflows/process-submission.yml');

  assert.match(
    workflow,
    /if: startsWith\(github\.event\.issue\.title, 'New Profile:'\)/
  );
  assert.doesNotMatch(workflow, /Update Profile:/);
});

test('valid new profile submission creates the automated pull request', async function () {
  const calls = {
    refs: [],
    files: [],
    pulls: [],
    comments: [],
    updates: []
  };
  const markdown = [
    '---',
    'name: "New Engineer"',
    'github: "new-engineer"',
    'specializations:',
    '  - "Cloud Security"',
    '---',
    ''
  ].join('\n');
  const encoded = Buffer.from(JSON.stringify({ version: 1, markdown })).toString('base64');
  const issue = {
    number: 404,
    title: 'New Profile: new-engineer',
    body: `<!-- PROFILE_SUBMISSION_START -->\n${encoded}\n<!-- PROFILE_SUBMISSION_END -->`
  };
  const github = {
    rest: {
      repos: {
        async getContent(options) {
          assert.equal(options.path, 'engineers');
          return { data: [] };
        },
        async createOrUpdateFileContents(options) {
          calls.files.push(options);
        }
      },
      git: {
        async getRef(options) {
          assert.equal(options.ref, 'heads/main');
          return { data: { object: { sha: 'main-sha' } } };
        },
        async createRef(options) {
          calls.refs.push(options);
        },
        async deleteRef() {
          throw new Error('unexpected branch deletion');
        }
      },
      pulls: {
        async create(options) {
          calls.pulls.push(options);
          return { data: { html_url: 'https://github.com/GRCEngClub/directory/pull/999' } };
        }
      },
      issues: {
        async addLabels() {},
        async createComment(options) {
          calls.comments.push(options);
        },
        async update(options) {
          calls.updates.push(options);
        }
      }
    }
  };

  await runWorkflow(issue, github);

  assert.equal(calls.refs.length, 1);
  assert.equal(calls.refs[0].ref, 'refs/heads/profile/new-engineer');
  assert.equal(calls.refs[0].sha, 'main-sha');
  assert.equal(calls.files.length, 1);
  assert.equal(calls.files[0].path, 'engineers/new-engineer.md');
  assert.equal(calls.files[0].branch, 'profile/new-engineer');
  assert.equal(calls.pulls.length, 1);
  assert.equal(calls.pulls[0].head, 'profile/new-engineer');
  assert.equal(calls.pulls[0].base, 'main');
  assert.match(calls.comments[0].body, /pull\/999/);
  assert.equal(calls.updates[0].state, 'closed');
  assert.equal(calls.updates[0].state_reason, 'completed');
});

test('web submission client can create new-profile issues only', function () {
  const submitScript = source('site/assets/js/submit.js');

  assert.match(submitScript, /var issueTitle = 'New Profile: ' \+ formData\.github;/);
  assert.doesNotMatch(submitScript, /Update Profile:/);
});

test('existing profile changes link directly to the GitHub PR backend', function () {
  const profile = source('site/_includes/layouts/profile.njk');

  assert.match(
    profile,
    /https:\/\/github\.com\/GRCEngClub\/directory\/edit\/main\/engineers\/\{\{ github \}\}\.md/
  );
  assert.match(profile, />Edit your profile on GitHub</);
  assert.match(
    profile,
    /Sign in to GitHub to edit this profile and submit the change as your pull request\./
  );
});

test('new-profile form directs existing members to GitHub pull requests', function () {
  const submit = source('site/submit.njk');

  assert.match(submit, /Already in the directory\?/);
  assert.match(submit, /Updates are submitted directly through GitHub/);
});
