import assert from "node:assert/strict";
import { test } from "node:test";
import { publicationBase, publicationDecision, publicationSource, websiteChanged } from "./publish-source.js";

const repository = "storytree-ai/storytree-website";
const head = "a".repeat(40);
const merged = "b".repeat(40);
const run = { conclusion: "success", event: "push", head_sha: head, head_branch: "main", head_repository: { full_name: repository } };

test("4.3 · a successful CI run of a push to this repository's main selects that commit", () => {
  assert.equal(publicationSource(run), head);
});

test("4.3 · failed, pull request, other-branch, foreign and malformed runs cannot publish", () => {
  assert.equal(publicationSource({ ...run, conclusion: "failure" }), undefined);
  assert.equal(publicationSource({ ...run, conclusion: null }), undefined);
  assert.equal(publicationSource({ ...run, event: "pull_request" }), undefined);
  assert.equal(publicationSource({ ...run, head_branch: "website" }), undefined);
  assert.equal(publicationSource({ ...run, head_repository: { full_name: "storytree-ai/storytree" } }), undefined);
  assert.equal(publicationSource({ ...run, head_repository: { full_name: "someone/fork" } }), undefined);
  assert.equal(publicationSource({ ...run, head_repository: null }), undefined);
  assert.equal(publicationSource({ ...run, head_sha: "main" }), undefined);
});

// Every file outside the submodule is the site's own; storytree's changes reach it only as a moved pin, which git's
// diff names as the submodule's path.
test("4.3 · the site's own changes and a moved storytree pin publish; notes and empty diffs do not", () => {
  for (const file of ["src/index.html", "public/forest.json", "src/forest-snapshot.json", "storytree", "pnpm-lock.yaml",
    "package.json", "pnpm-workspace.yaml", ".github/workflows/website.yml", ".gitmodules", "tsconfig.json"]) {
    assert.equal(websiteChanged([file]), true, file);
  }
  assert.equal(websiteChanged(["README.md", "FOREST.md"]), false);
  assert.equal(websiteChanged([]), false);
  assert.equal(websiteChanged([""]), false, "git's empty diff splits to one empty line");
  assert.equal(websiteChanged(["README.md", "storytree"]), true);
});

test("4.3 · a merge is compared with the commit the live site carries, so a merge whose own run was cancelled still publishes", () => {
  const live = "c".repeat(40);
  const ancestors = new Set([live]);
  const isAncestor = (commit: string) => ancestors.has(commit);
  assert.equal(publicationBase(merged, `${live}\n`, isAncestor), live);
  assert.equal(publicationBase(merged, undefined, isAncestor), `${merged}^1`, "an unreachable live site falls back to the merge's own change");
});

// At the switch the live site names storytree's repository's commit, which no commit here descends from.
test("4.3 · a live site that names no commit of this merge's history is republished by the next successful main run", () => {
  const live = "c".repeat(40);
  const isAncestor = (commit: string) => commit === live;
  for (const unnamed of ["unpublished local build\n", "Not found", "d".repeat(40)]) {
    const decision = publicationDecision(merged, unnamed, isAncestor, () => assert.fail("no base to diff from"));
    assert.equal(decision.publish, true, unnamed);
    assert.match(decision.why, /names no commit/);
  }
  assert.equal(publicationDecision(merged, `${live}\n`, isAncestor, () => ["README.md"]).publish, false,
    "a live site at an ancestor with no site change since stays");
  assert.equal(publicationDecision(merged, `${live}\n`, isAncestor, base => base === live ? ["storytree"] : []).publish, true,
    "a pin moved since the live commit publishes");
  assert.equal(publicationDecision(merged, undefined, isAncestor, base => base === `${merged}^1` ? [] : ["src/main.ts"]).publish, false,
    "an unreachable live site compares with the merge's own change");
});
