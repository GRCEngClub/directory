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

test('update issues are redirected to the authenticated GitHub edit flow', function () {
  const workflow = source('.github/workflows/process-submission.yml');
  const redirectIndex = workflow.indexOf('Update your profile on GitHub');
  const updateHandlerIndex = workflow.indexOf('if (isUpdateSubmission)');
  const payloadParsingIndex = workflow.indexOf('let content;');
  const branchIndex = workflow.indexOf('// --- Create branch ---');

  assert.match(
    workflow,
    /startsWith\(github\.event\.issue\.title, 'Update Profile:'\)/
  );
  assert.match(
    workflow,
    /https:\/\/github\.com\/\$\{context\.repo\.owner\}\/\$\{context\.repo\.repo\}\/edit\/main\/\$\{existingProfilePath\}/
  );
  assert.ok(redirectIndex > -1, 'workflow must explain that updates happen on GitHub');
  assert.ok(
    updateHandlerIndex > -1 && updateHandlerIndex < payloadParsingIndex,
    'update issues must be routed before issue payload parsing'
  );
  assert.ok(redirectIndex < branchIndex, 'update redirect must happen before branch creation');
});

test('malformed update issue is closed with the exact GitHub edit link and no repository mutation', async function () {
  const comments = [];
  const updates = [];
  const github = {
    rest: {
      repos: {
        async getContent(options) {
          if (options.path === 'engineers') {
            return {
              data: [
                { type: 'file', name: 'itsrubenclarke.md', path: 'engineers/itsrubenclarke.md' }
              ]
            };
          }
          assert.equal(options.path, 'engineers/itsrubenclarke.md');
          return {
            data: {
              content: Buffer.from('github: "itsrubenclarke"\n').toString('base64')
            }
          };
        }
      },
      issues: {
        async createComment(options) {
          comments.push(options.body);
        },
        async update(options) {
          updates.push(options);
        }
      },
      git: new Proxy({}, {
        get() {
          throw new Error('update issue reached Git branch mutation');
        }
      }),
      pulls: new Proxy({}, {
        get() {
          throw new Error('update issue reached pull-request creation');
        }
      })
    }
  };

  await runWorkflow(
    { number: 130, title: 'Update Profile: itsrubenclarke', body: '' },
    github
  );

  assert.deepEqual(comments, [
    '⚠️ Update your profile on GitHub so the change is authenticated to your account and submitted as your pull request: https://github.com/GRCEngClub/directory/edit/main/engineers/itsrubenclarke.md'
  ]);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].state, 'closed');
  assert.equal(updates[0].state_reason, 'completed');
});

test('profile pages expose an exact GitHub edit link', function () {
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

test('submission form states that existing profiles are updated on GitHub', function () {
  const submit = source('site/submit.njk');

  assert.match(submit, /Already in the directory\?/);
  assert.match(submit, /Updates are submitted directly through GitHub/);
});
