import { useEffect, type ReactNode } from "react";
import { jumpTo } from "../lib/jump.ts";
import { REFERENCES } from "../lib/references.ts";

/** Footnote marker like [1] that jumps to the References list. */
export function Ref({ n }: { n: number }) {
  return (
    <sup className="ref-mark">
      <a href={`#ref-${n}`} aria-label={`Source ${n}`} onClick={(e) => jumpTo(`ref-${n}`, e)}>
        [{n}]
      </a>
    </sup>
  );
}

export function References(): ReactNode {
  // A shared link like #ref-3 or #no-2024-2025 loads before this section renders, so scroll once it exists.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id.startsWith("ref-") || id === "no-2024-2025") {
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    }
  }, []);
  return (
    <section id="references" className="references" aria-labelledby="references-title">
      <h2 id="references-title">References</h2>
      <ol className="ref-list">
        {REFERENCES.map((r) => (
          <li key={r.n} id={`ref-${r.n}`} value={r.n}>
            <span className="ref-title">{r.title}</span>. {r.publisher}.{" "}
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="ref-url">
              {r.url}
            </a>{" "}
            (accessed {r.accessed}).
            <blockquote>“{r.quote}”</blockquote>
          </li>
        ))}
      </ol>
    </section>
  );
}
