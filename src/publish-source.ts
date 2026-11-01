/** Capability 4 · Publish on merge. */

export interface CheckedRun {
  conclusion: string | null;
  event: string;
  head_sha: string;
  head_branch: string;
  head_repository: { full_name: string } | null;
}

export const REPOSITORY = "storytree-ai/storytree-website";

/**
 * Contract 4.3: accept only a successful CI run of a push to this repository's main. Changes land here by pushing main,
 * so a pull request's run tested a commit that main may never carry.
 */
export function publicationSource(run: CheckedRun): string | undefined {
  if (run.conclusion !== "success" || run.head_repository?.full_name !== REPOSITORY) return undefined;
  if (run.event !== "push" || run.head_branch !== "main") return undefined;
  return /^[a-f0-9]{40}$/.test(run.head_sha) ? run.head_sha : undefined;
}

/** Contract 4.4: the live site names the merge it was built from. */
export const LIVE_VERSION = "https://storytree.dev/version.txt";

/**
 * Where to look for site changes up to `sha`: from the commit the live site carries, so a merge whose own run was
 * cancelled by a later one is still seen. A live site that answers with no commit of `sha`'s history (a build without
 * WEBSITE_SHA, or storytree's repository's, before the switch) has no base: the merge republishes it. An unreachable
 * live site falls back to `sha`'s first parent.
 */
export function publicationBase(sha: string, live: string | undefined, isAncestor: (commit: string) => boolean): string | undefined {
  if (live === undefined) return `${sha}^1`;
  const version = live.trim();
  return /^[a-f0-9]{40}$/.test(version) && isAncestor(version) ? version : undefined;
}

/**
 * Contract 4.3: whether this merge publishes, and why, from what the live site names and the paths that changed
 * since `base` (git's diff, read only when a base is known).
 */
export function publicationDecision(sha: string, live: string | undefined, isAncestor: (commit: string) => boolean,
  changedSince: (base: string) => readonly string[]): { publish: boolean; why: string } {
  const base = publicationBase(sha, live, isAncestor);
  if (!base) return { publish: true, why: `The live site names no commit before ${sha}; republishing it.` };
  if (!websiteChanged(changedSince(base))) {
    return { publish: false, why: `Skipping website publication: no site inputs changed from ${base} to this merge.` };
  }
  return { publish: true, why: `Site inputs changed from ${base} to this merge.` };
}

/**
 * Contract 4.3: everything in this repository is the site's, so any changed path is an input except its top-level
 * Markdown notes. storytree's changes reach the site only by moving the submodule pin, which git's diff names as the
 * submodule's path, `storytree`.
 */
export function websiteChanged(paths: readonly string[]): boolean {
  return paths.some(file => file !== "" && !/^[^/]+\.md$/.test(file));
}
