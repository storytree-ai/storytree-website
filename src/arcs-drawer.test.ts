import assert from "node:assert/strict";
import { test } from "node:test";
import { Window as HappyWindow } from "happy-dom";
import { mountArcsDrawer } from "./arcs-drawer.js";

function framed() {
  const dom = new HappyWindow();
  const document = dom.document as unknown as Document;
  document.body.innerHTML = `<div id="map-frame"><div class="map-arcs"></div></div>`;
  const host = document.querySelector<HTMLElement>(".map-arcs")!;
  const mounted: HTMLElement[] = [];
  let stopped = 0;
  const stop = mountArcsDrawer(host, panel => { mounted.push(panel); panel.innerHTML = `<div class="arc-surface-mount">board</div>`; return () => { stopped++; }; });
  const handle = host.querySelector<HTMLButtonElement>(".map-arcs-handle")!, drawer = host.querySelector<HTMLElement>(".map-arcs-drawer")!;
  const key = (target: EventTarget, name: string) => target.dispatchEvent(new dom.KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }) as unknown as Event);
  return { document, host, handle, drawer, mounted, stop, stopped: () => stopped, key };
}

test("2.36 · the framed map's Arcs bar opens the arc board over the map, and the bar or Escape closes it again", () => {
  const { document, handle, drawer, mounted, stop, stopped, key } = framed();
  assert.equal(mounted.length, 1, "the board mounts once, inside the drawer");
  assert.ok(drawer.contains(mounted[0]!));
  assert.ok(drawer.hidden, "the board starts closed, the map whole");
  assert.equal(handle.getAttribute("aria-expanded"), "false");
  assert.equal(handle.getAttribute("aria-controls"), drawer.id);
  assert.match(handle.textContent ?? "", /Arcs/);

  handle.click();
  assert.ok(!drawer.hidden, "the bar opens the board");
  assert.equal(handle.getAttribute("aria-expanded"), "true");
  handle.click();
  assert.ok(drawer.hidden, "the bar closes it again");

  handle.click();
  key(mounted[0]!.firstElementChild!, "Escape");
  assert.ok(drawer.hidden, "Escape inside the board closes it");
  assert.equal(handle.getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement, handle, "and gives the focus back to the bar");

  key(document.body, "Escape");
  assert.ok(drawer.hidden, "Escape elsewhere leaves it closed");

  stop();
  assert.equal(stopped(), 1, "stopping the drawer stops the board");
  assert.equal(document.querySelector(".map-arcs-handle"), null);
});
