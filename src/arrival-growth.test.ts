import assert from "node:assert/strict";
import { test } from "node:test";
import saved from "./forest-snapshot.json" with { type: "json" };
import type { TourSnapshot } from "./forest-data.js";
import { arrivalGrowth } from "./arrival-growth.js";

const snapshot = saved as unknown as TourSnapshot;

test("2.32 · on arrival the framed map draws itself from a point: the globe swells, then every island rises, each that builds on another after one it builds on, within about twelve seconds", () => {
  const plan = arrivalGrowth(snapshot);
  assert.ok(plan.globe, "the globe swells from a point before the land rises");
  const islands = snapshot.scene.islands.map(island => island.story);
  assert.deepEqual([...plan.islands.keys()].sort(), [...islands].sort(), "every island of the saved map rises");
  const first = Math.min(...[...plan.islands.values()].map(window => window.start));
  assert.ok(first >= plan.globe.start + plan.globe.seconds * 0.5, "the islands rise once the globe has swelled");
  const starts = new Set([...plan.islands.values()].map(window => window.start));
  assert.ok(starts.size > 1, "the islands rise one after another, not all at once");
  const storyOf = new Map(snapshot.scene.islands.flatMap(island => island.trees.map(tree => [tree.capability, island.story] as const)));
  const buildsOn = new Map<string, Set<string>>();
  for (const link of snapshot.scene.links ?? []) {
    const [from, to] = [storyOf.get(link.from), storyOf.get(link.to)];
    if (from !== undefined && to !== undefined && from !== to) buildsOn.set(from, (buildsOn.get(from) ?? new Set()).add(to));
  }
  assert.ok(buildsOn.size > 0, "the saved map has islands that build on others");
  for (const [story, under] of buildsOn) {
    const rises = plan.islands.get(story)!.start;
    assert.ok([...under].some(other => plan.islands.get(other)!.start < rises), `${story} rises after an island it builds on`);
  }
  assert.ok(Math.abs(plan.seconds - 12) < 0.01, `the whole growth takes about twelve seconds (${plan.seconds})`);
});
