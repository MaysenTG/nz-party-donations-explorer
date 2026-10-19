import { useEffect, type ReactNode } from "react";
import { jumpTo } from "../lib/jump.ts";
import { REFERENCES } from "../lib/references.ts";

function openReferencesPanel() {
  const panel = document.getElementById("references");
  if (panel instanceof HTMLDetailsElement) panel.open = true;
}

/** Footnote marker like [1] that jumps to the References list. */
export function Ref({ n }: { n: number }) {
  return (
    <sup className="ref-mark">
      <a
        href={`#ref-${n}`}
        aria-label={`Source ${n}`}
        onClick={(event) => {
          event.preventDefault();
          openReferencesPanel();
          requestAnimationFrame(() => jumpTo(`ref-${n}`));
        }}
      >
        [{n}]
      </a>
    </sup>
  );
}

export function References(): ReactNode {
  // A shared link like #ref-3 or #no-2024-2025 loads before this section renders, so scroll once it exists.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id.startsWith("ref-")) {
      openReferencesPanel();
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
      return;
    }
    if (id === "no-2024-2025") {
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    }
  }, []);

  return (
    <details id="references" className="footer-fold references">
      <summary>
        <span id="references-title" className="footer-fold-title">
          References
        </span>
        <span className="summary-meta">
          <span className="badge">{REFERENCES.length}</span>
          <span className="when-open">Hide</span>
          <span className="when-closed">Show</span>
        </span>
      </summary>
      <p className="ref-intro">
        Each footnote marker on this page points here. Quotes are copied from the source.
      </p>
      <ol className="ref-list">
        {REFERENCES.map((r) => (
          <li key={r.n} id={`ref-${r.n}`} value={r.n} className="ref-item">
            <p className="ref-label">
              <span className="ref-num" aria-hidden="true">
                [{r.n}]
              </span>{" "}
              {r.label}
            </p>
            <p className="ref-source">
              <cite>{r.title}</cite>
              <span className="ref-publisher">{r.publisher}</span>
            </p>
            <blockquote className="ref-quote">“{r.quote}”</blockquote>
            <p className="ref-meta">
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                Open source
              </a>
              <span>Accessed {r.accessed}</span>
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}
