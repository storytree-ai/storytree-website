// The thin Actions front door. Selection runs from trusted main, never a pull request's code or artifacts.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LIVE_VERSION, publicationDecision, publicationSource, REPOSITORY, websiteChanged } from "./src/publish-source.ts";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const ancestor = (commit, of) => {
  try {
    git("merge-base", "--is-ancestor", commit, of);
    return true;
  } catch {
    return false;
  }
};
async function liveVersion() {
  try {
    const response = await fetch(LIVE_VERSION, { signal: AbortSignal.timeout(15_000) });
    return response.ok ? await response.text() : undefined;
  } catch {
    return undefined;
  }
}
const changed = (before, after) => git("diff", "--name-only", "--no-renames", before, after, "--").split("\n");

function currentInputs(sha) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Missing verified merge commit.");
  git("merge-base", "--is-ancestor", sha, "origin/main");
  if (websiteChanged(changed(sha, "origin/main"))) {
    console.log("Skipping website publication: newer site inputs are already on main.");
    return false;
  }
  return true;
}

async function source() {
  if (process.env.GITHUB_REPOSITORY !== REPOSITORY) throw new Error("Wrong publishing repository.");
  if (process.env.GITHUB_EVENT_NAME === "workflow_dispatch") {
    if (process.env.GITHUB_REF !== "refs/heads/main") return undefined;
    return git("rev-parse", "origin/main");
  }
  const { workflow_run: run } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const sha = run && publicationSource(run);
  if (!sha) return undefined;
  git("fetch", "--quiet", "origin", "main");
  const decision = publicationDecision(sha, await liveVersion(), commit => ancestor(commit, sha), base => changed(base, sha));
  console.log(decision.why);
  return decision.publish ? sha : undefined;
}

if (process.argv[2] === "source") {
  const sha = await source();
  if (sha && currentInputs(sha)) {
    appendFileSync(process.env.GITHUB_OUTPUT, `sha=${sha}\n`);
    console.log(`Selected website merge ${sha}.`);
  } else if (!sha) console.log("No eligible merged website change to publish.");
} else if (process.argv[2] === "publish") {
  const { publishWebsite } = await import("./src/publish.ts");
  const sha = process.env.WEBSITE_SHA;
  const options = { directory: fileURLToPath(new URL("./dist/", import.meta.url)), token: process.env.HERENOW_TOKEN, commit: sha };
  if (git("rev-parse", "HEAD") !== sha) throw new Error("Checkout does not match the selected website merge.");
  if (!options.token?.trim()) await publishWebsite(options);
  else {
    git("fetch", "--quiet", "origin", "main");
    if (currentInputs(sha)) await publishWebsite(options);
  }
} else throw new Error("Use source or publish.");
