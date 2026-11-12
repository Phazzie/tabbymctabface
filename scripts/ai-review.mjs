#!/usr/bin/env node
/**
 * Pull-request review via the xAI chat API.
 * Skips cleanly (exit 0) when XAI_API_KEY is unset or the origin CLI is
 * missing, so CI stays green before those are available. Posts or updates
 * one Origin comment when a pull request number is set:
 *   origin pr comment <PR_NUMBER> --body-file ... --edit-last --create-if-none
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const MARKER = "<!-- tabbymctabface-ai-review -->";
const DIFF_CAP = 14_000;

export function reviewDecision(env, originOnPath) {
  if (!env.XAI_API_KEY?.trim()) return { action: "skip", reason: "XAI_API_KEY is not set" };
  if (!originOnPath) return { action: "skip", reason: "origin CLI is not installed" };
  return { action: "review" };
}

export function clipDiff(diff) {
  const text = diff.trim();
  if (text.length <= DIFF_CAP) return text;
  return `${text.slice(0, DIFF_CAP)}\n\n[diff truncated]`;
}

export function reviewPrompt(diff) {
  return [
    "You are reviewing a pull request for TabbyMcTabface, a Chrome MV3 extension written in TypeScript.",
    "It manages tabs and tab groups and delivers passive-aggressive quips through Result-returning seams.",
    "Comment only on real bugs, broken tab or group behavior, Chrome permission mistakes, or error-handling that throws instead of returning Result.",
    "Skip style nits. Use short paragraphs. If nothing is wrong, say so in one sentence.",
    "",
    clipDiff(diff),
  ].join("\n");
}

export function originCommentArgs(prNumber, bodyFile) {
  return ["pr", "comment", String(prNumber), "--body-file", bodyFile, "--edit-last", "--create-if-none"];
}

function pullRequestNumber(env) {
  if (env.PR_NUMBER) return String(env.PR_NUMBER);
  return "";
}

export function originCliAvailable() {
  try {
    execFileSync("origin", ["--version"], { stdio: "ignore" });
    return true;
  } catch (error) {
    return error?.code !== "ENOENT";
  }
}

function diffAgainstBase(env) {
  const base = env.GITHUB_BASE_REF || env.BASE_REF || "main";
  try {
    execFileSync("git", ["fetch", "origin", base, "--depth", "50"], { stdio: "ignore" });
  } catch {
    // The checkout may already contain the base.
  }
  try {
    return execFileSync("git", ["diff", `origin/${base}...HEAD`], { encoding: "utf8", maxBuffer: 8_000_000 });
  } catch {
    return execFileSync("git", ["diff", "HEAD~1"], { encoding: "utf8", maxBuffer: 8_000_000 });
  }
}

async function askGrok(apiKey, diff) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 500,
      messages: [
        { role: "system", content: "You review code diffs. Be specific and brief." },
        { role: "user", content: reviewPrompt(diff) },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`xAI review failed (${res.status})`);
  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("xAI review returned an empty note");
  return text;
}

function publishOnOrigin(number, body) {
  const file = execFileSync("mktemp", { encoding: "utf8" }).trim();
  try {
    writeFileSync(file, body);
    execFileSync("origin", originCommentArgs(number, file), { stdio: "inherit" });
  } finally {
    try {
      execFileSync("rm", ["-f", file]);
    } catch {
      // The temp file only held the review text.
    }
  }
}

async function publish(env, body) {
  const number = pullRequestNumber(env);
  if (!number) {
    console.log(body);
    console.log("AI review printed locally. Set PR_NUMBER to comment on the Origin pull request.");
    return;
  }
  try {
    publishOnOrigin(number, body);
  } catch (error) {
    console.log(body);
    console.error(error instanceof Error ? error.message : error);
    console.log("Origin comment failed. The review is in the log above.");
  }
}

async function main() {
  const decision = reviewDecision(process.env, originCliAvailable());
  if (decision.action === "skip") {
    console.log(`AI review skipped: ${decision.reason}`);
    return;
  }
  const diff = diffAgainstBase(process.env);
  if (!diff.trim()) {
    console.log("AI review skipped: empty diff");
    return;
  }
  const note = await askGrok(process.env.XAI_API_KEY.trim(), diff);
  const body = `${MARKER}\n**Grok review**\n\n${note}`;
  await publish(process.env, body);
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
