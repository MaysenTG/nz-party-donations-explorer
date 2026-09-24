import { SOURCE_30K_URL, SOURCE_URL } from "../lib/source.ts";

export function DataCoverageNotice() {
  return (
    <aside className="coverage-notice" aria-labelledby="coverage-title">
      <h2 id="coverage-title">About the years in this dataset</h2>
      <p>
        Returns here come from two Electoral Commission lists:{" "}
        <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
          donations exceeding $30,000
        </a>{" "}
        (mainly 2011–2022, plus older 2008–2010 disclosures) and{" "}
        <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
          donations exceeding $20,000
        </a>{" "}
        as currently published for the 2026 election-year period. That is why{" "}
        <strong>2023–2025 show no donations</strong> on the charts: those years are not in the
        scraped source files, not because nothing was given. Under today’s rules, the $20,000
        continuous disclosures are mainly required in election years.
      </p>
    </aside>
  );
}
