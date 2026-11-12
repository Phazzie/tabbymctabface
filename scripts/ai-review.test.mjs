import assert from "node:assert/strict";
import { test } from "node:test";
import { clipDiff, originCommentArgs, reviewDecision } from "./ai-review.mjs";

test("skips when XAI_API_KEY is missing", () => {
  assert.deepEqual(reviewDecision({}, true), {
    action: "skip",
    reason: "XAI_API_KEY is not set",
  });
  assert.deepEqual(reviewDecision({ XAI_API_KEY: "  " }, true), {
    action: "skip",
    reason: "XAI_API_KEY is not set",
  });
});

test("skips when the origin CLI is missing", () => {
  assert.deepEqual(reviewDecision({ XAI_API_KEY: "present" }, false), {
    action: "skip",
    reason: "origin CLI is not installed",
  });
});

test("reviews when the key and the origin CLI are both present", () => {
  assert.deepEqual(reviewDecision({ XAI_API_KEY: " present " }, true), { action: "review" });
});

test("posts with origin pr comment --body-file --edit-last --create-if-none", () => {
  assert.deepEqual(originCommentArgs(42, "/tmp/review.md"), [
    "pr",
    "comment",
    "42",
    "--body-file",
    "/tmp/review.md",
    "--edit-last",
    "--create-if-none",
  ]);
});

test("clips oversized diffs", () => {
  const clipped = clipDiff(`x${"a".repeat(20_000)}`);
  assert.match(clipped, /\[diff truncated\]$/);
  assert.ok(clipped.length < 20_000);
});
