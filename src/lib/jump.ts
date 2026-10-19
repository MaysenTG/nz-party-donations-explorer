import type { MouseEvent } from "react";

/** Scroll to an in-page anchor. Works after late renders with a plain hash. */
export function jumpTo(id: string, event?: MouseEvent) {
  const el = document.getElementById(id);
  if (!el) return;
  event?.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(history.state, "", `${location.pathname}${location.search}#${id}`);
}
