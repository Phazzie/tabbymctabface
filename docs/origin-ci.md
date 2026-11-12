# Origin CI

GitHub Actions does not run for this account (billing lock). CI for TabbyMcTabface lives in Cursor Origin and runs through the Depot app: GitHub Actions-syntax YAML in [`.depot/workflows/ci.yml`](../.depot/workflows/ci.yml), on the `depot-ubuntu-24.04` runner. Depot starts using that file once this repo is detached from GitHub.

`.github/` stays. The only file there today is [`.github/copilot-instructions.md`](../.github/copilot-instructions.md). There is no `.github/workflows/` directory and nothing in it to delete.

## Workflow map

| GitHub Actions workflow | Depot equivalent | What runs |
| --- | --- | --- |
| None. No `.github/workflows/*.yml` exists. | [`.depot/workflows/ci.yml`](../.depot/workflows/ci.yml) | `verify` on every pull request and on pushes to `main`. `ai-review` on pull requests only. |

`verify` uses a locked install and this repo's scripts:

| Step | Command | Notes |
| --- | --- | --- |
| Install | `npm ci` | Node.js 22, npm cache from `package-lock.json`. |
| Typecheck | `npm run lint` | `tsc --noEmit` using [`tsconfig.json`](../tsconfig.json), which extends [`tsconfig.build.json`](../tsconfig.build.json). Tests and mocks stay excluded, same as the production compile. |
| Tests | `npm test` | `vitest run` (single run, not watch). |
| Review script | `node --test scripts/ai-review.test.mjs` | Skip and comment-flag checks. No network. |
| Build | `npm run build` | `clean`, `tsc -p tsconfig.build.json`, popup compile, copy manifest, HTML, CSS, icons, and quips into `dist/`. |
| Zip | `npm run package` | Runs the build again and writes `TabbyMcTabface-v1.0.0.zip`. |
| Artifact | `actions/upload-artifact@v4` | Uploads that zip as `tabbymctabface-extension`. |

`npm run lint` does not typecheck `src/**/*.test.ts` or `src/mocks`. Those files are already excluded from `tsconfig.build.json`, and several no longer match the contracts (`NotificationsAPIError` versus `NotificationError`, storage quota field names, `MockTabManager` groups). Vitest still executes the tests. That drift was left alone.

`ai-review` checks out full history, runs `npm ci` and `node --test scripts/ai-review.test.mjs`, then `node scripts/ai-review.mjs`. The script asks Grok (`grok-4.5` on `https://api.x.ai/v1/chat/completions`) and posts one comment:

```sh
origin pr comment "$PR_NUMBER" --body-file "$FILE" --edit-last --create-if-none
```

`PR_NUMBER` comes from `github.event.pull_request.number`. The diff is `origin/${GITHUB_BASE_REF}...HEAD`, falling back to `HEAD~1`.

If `XAI_API_KEY` is unset, or the `origin` binary is not on `PATH`, the script prints a skip line and exits 0. If the comment command fails, it prints the review to the log and still exits 0. An xAI error when the key and CLI are both present fails the job.

## GitHub-only pieces (dropped)

Nothing automated is being removed, because Actions was never configured here.

These stay outside Depot and will not be recreated as GitHub workflows:

- **GitHub Actions runs, checks, and `GITHUB_TOKEN`.** Review comments go through `origin pr comment`, not the GitHub issues API.
- **Copilot repo instructions** (`.github/copilot-instructions.md`). Kept. Not a workflow.
- **Chrome Web Store upload.** [BUILD.md](../BUILD.md) and [PRE_DEPLOYMENT_CHECKLIST.md](../PRE_DEPLOYMENT_CHECKLIST.md) describe a manual dashboard upload. There is no store token, `chrome-webstore-upload` step, or release workflow to migrate.
- **Dependabot, code scanning, GitHub environments, and environment protection rules.** None are configured.

A later GitHub-only feature (release assets published with `GITHUB_TOKEN`, `workflow_dispatch` deploy, or a store-upload action) would be dropped rather than copied into Depot.

## Secrets to enter in Depot

No GitHub Actions secrets exist to copy. Create these in Depot for this repo:

| Secret | Required for a green job? | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | No. Missing key skips the review and exits 0. | Bearer token for the Grok review. The `ai-review` job maps it to `XAI_API_KEY`. |
| `CURSOR_API_KEY` or `CURSOR_AUTH_TOKEN` | No. A missing CLI, or a comment that fails, exits 0 and leaves the review in the log. | Only if the Depot runner does not already authenticate `origin`. The workflow does not pass this variable, so an injected runner credential is left alone. Set one of them in the Depot environment when comments do not post. Do not commit either value. |

No other secret is read by `.depot/workflows/ci.yml`.
