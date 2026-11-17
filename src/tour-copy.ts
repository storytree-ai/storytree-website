/**
 * Capability 1 · Home page. The words of the tour's last two opening steps, kept for the page's sections below the map
 * (ADR-1091 D1 (3), (4)): the claims and the harness come from these when their increments place them.
 */

/** Another company's published mark, shown unaltered beside its name as a plain "works with" reference. */
export type Mark = { name: string; src: string };

export const fixes = {
  title: "What storytree fixes",
  // The owner's three promises, each a single line, the hook: the short beside it carries the without and with (ADR-1104 D1).
  promises: ["Watch your software grow on a map.", "One map for you and your agents.", "Memory that lives where your code lives."],
  why: "Storytree answers to three principles. Truth. Everything storytree shows is a reading taken from the real code and the real work, and every reading carries its source. A signal that cannot name what it was read from, by whom and when is decoration and goes; the source itself stays off the face and one step away, and the face owes the reader only this much: a report is never drawn so it passes for a measurement, and a stale or unknown reading is never drawn so it passes for a live one. Proportion. Your attention is a cup, and storytree paints knowing how full it is. A surface asks for a handful of distinct things at rest, quietens the rest rather than deleting it, and is full when one more thing that needed you would go unseen. Agency. You choose where to look and how deep to go, and nothing is ever out of reach. Triage comes to you; investigation is yours to pull; whatever storytree quietened, hid or kept off the face, a signal's source included, but not a part's reasoning, which is the agent's record, comes back from where you stand, with its identity intact.",
};

// The harnesses storytree watches and its setup check verifies (each its maker's own published mark, as the map-harness
// and harness-pi captures recorded). Another harness is one more entry here, once storytree watches it; one that only speaks MCP
// is covered by the line beneath the marks (ADR-1007 D5, as ADR-1018 D11 words it).
export const harness = {
  title: "Works with your existing harness",
  // The owner's line (2026-10-13).
  claim: "Storytree works with your existing coding harness.",
  how: "Storytree doesn't replace the agent you code with. When you set up a project it looks for Claude Code and Codex, and joins their sessions through hooks and an MCP server: the hooks tell storytree what each session reads and changes, and the MCP server gives the agent storytree's tools for the plan and the library. Any other harness that speaks MCP can connect to the server too: it gets the plan, claims and the library, though storytree doesn't watch its session.",
  why: "You keep the agents, prompts and habits you already have; storytree adds the map beside them.",
  marks: [{ name: "Claude Code", src: "/harness/claude-code.png" }, { name: "Codex", src: "/harness/codex.png" }, { name: "Pi", src: "/harness/pi.svg" }] satisfies Mark[],
  marksNote: "And any harness that speaks MCP.",
};
