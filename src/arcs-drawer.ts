/**
 * Capability 2 · The forest on the site. The framed map's Arcs bar (2.36): the arc board opens from a bar along the frame's top,
 * over the map, and the bar or Escape closes it again. The board is the desktop's own, which lives in the app's left rail there
 * (ADR-1219); the frame keeps the place the site gave it, so only the bar is the site's.
 */
export function mountArcsDrawer(host: HTMLElement, mount: (panel: HTMLElement) => () => void): () => void {
  const document = host.ownerDocument;
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "map-arcs-handle";
  handle.setAttribute("aria-controls", "map-arcs-drawer");
  handle.innerHTML = `<span class="map-arcs-label">Arcs</span><span class="map-arcs-caret" aria-hidden="true"></span>`;
  const drawer = document.createElement("section");
  drawer.id = "map-arcs-drawer";
  drawer.className = "map-arcs-drawer";
  drawer.setAttribute("aria-label", "Arcs");
  const show = (open: boolean) => {
    drawer.hidden = !open;
    handle.setAttribute("aria-expanded", String(open));
    handle.querySelector(".map-arcs-caret")!.textContent = open ? "▴" : "▾";
  };
  show(false);
  handle.addEventListener("click", () => show(drawer.hidden !== false));
  drawer.addEventListener("keydown", event => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    show(false);
    handle.focus();
  });
  host.append(handle, drawer);
  const stop = mount(drawer);
  return () => { stop(); handle.remove(); drawer.remove(); };
}
