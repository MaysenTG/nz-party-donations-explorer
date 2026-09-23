import { useMemo, useState } from "react";
import { ActiveFilters } from "./components/ActiveFilters.tsx";
import { DonationsTable } from "./components/DonationsTable.tsx";
import { ElectionCycles } from "./components/ElectionCycles.tsx";
import { Filters } from "./components/Filters.tsx";
import { RankChart } from "./components/RankChart.tsx";
import { ScrollToTop } from "./components/ScrollToTop.tsx";
import { SummaryStrip } from "./components/SummaryStrip.tsx";
import { TimeSeries } from "./components/TimeSeries.tsx";
import { YearFilter } from "./components/YearFilter.tsx";
import { donationsToCsv, downloadCsv } from "./lib/csv.ts";
import { formatIsoLong } from "./lib/dates.ts";
import {
  ALL_PARTIES,
  applyFilters,
  createDefaultFilters,
  donations,
  donorCount,
  filterProblem,
  filterRangeLabel,
  donationSeries,
  partyCounts,
  partyTotals,
  RECEIVED_MAX,
  RECEIVED_MIN,
  sortDonations,
  summarise,
  topDonors,
} from "./lib/donations.ts";
import { ELECTION_CYCLE_SUMMARIES } from "./lib/elections.ts";
import { formatCount, formatShare } from "./lib/format.ts";
import { partyColour } from "./lib/parties.ts";
import {
  SOURCE_30K_LABEL,
  SOURCE_30K_URL,
  SOURCE_LABEL,
  SOURCE_URL,
} from "./lib/source.ts";
import type { DonorTypeFilter, Filters as FilterState, SortKey, SortState } from "./types.ts";

const OVERALL = summarise(donations);

function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  const dir = key === "party" || key === "donor" ? "asc" : "desc";
  return { key, dir };
}

function focusParty(filters: FilterState, party: string): FilterState {
  const onlyThis = filters.parties.length === 1 && filters.parties[0] === party;
  return { ...filters, parties: onlyThis ? [...ALL_PARTIES] : [party] };
}

function focusDonor(filters: FilterState, name: string): FilterState {
  const query = filters.query.trim() === name ? "" : name;
  return { ...filters, query };
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters);
  const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });

  const problem = filterProblem(filters);
  const filtered = useMemo(() => applyFilters(donations, filters), [filters]);
  const sorted = useMemo(() => sortDonations(filtered, sort), [filtered, sort]);
  const summary = useMemo(() => summarise(filtered), [filtered]);
  const parties = useMemo(() => partyTotals(filtered), [filtered]);
  const donors = useMemo(() => topDonors(filtered, 12), [filtered]);
  const timeSeries = useMemo(() => donationSeries(filtered), [filtered]);
  const rangeLabel = useMemo(() => filterRangeLabel(filters), [filters]);
  const partyFacet = useMemo(
    () => partyCounts(applyFilters(donations, filters, { party: true })),
    [filters],
  );
  const donorFacetRows = useMemo(
    () => applyFilters(donations, filters, { donorType: true }),
    [filters],
  );
  const donorTypeCounts = useMemo<Record<DonorTypeFilter, number>>(() => {
    let individual = 0;
    let organisation = 0;
    for (const row of donorFacetRows) {
      if (row.donorType === "individual") individual += 1;
      else organisation += 1;
    }
    return { all: donorFacetRows.length, individual, organisation };
  }, [donorFacetRows]);

  const focusedParty = filters.parties.length === 1 ? filters.parties[0] : null;
  const focusedDonor = filters.query.trim();
  const hiddenDonors = Math.max(0, donorCount(filtered) - donors.length);

  function exportCsv() {
    downloadCsv("nz-party-donations.csv", donationsToCsv(sorted));
  }

  return (
    <>
      <a className="skip" href="#results">
        Skip to results
      </a>
      <header className="site-header">
        <div className="wrap">
          <p className="eyebrow">Elections NZ disclosures · unofficial view</p>
          <h1>Declared party donations</h1>
          <p className="lede">
            Political party donations declared to the Electoral Commission: gifts exceeding $20,000
            under the current rules, plus earlier returns for donations exceeding $30,000
            (2011–2022) and the older $20,000 threshold (2008–2010). Smaller gifts are not included,
            and nothing here is estimated or added.
          </p>
          <p className="source-line">
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_LABEL}
            </a>
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_30K_LABEL}
            </a>
            <span>
              {formatCount(donations.length)} returns · received {formatIsoLong(RECEIVED_MIN)} to{" "}
              {formatIsoLong(RECEIVED_MAX)}
            </span>
          </p>
        </div>
      </header>

      <main className="wrap">
        <YearFilter filters={filters} onChange={setFilters} />
        <SummaryStrip summary={summary} overall={OVERALL} rangeLabel={rangeLabel} />
        <div className="layout">
          <Filters
            filters={filters}
            partyCounts={partyFacet}
            donorTypeCounts={donorTypeCounts}
            problem={problem}
            onChange={setFilters}
            onReset={() => setFilters(createDefaultFilters())}
          />

          <div className="results" id="results">
            <ActiveFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(createDefaultFilters())}
            />

            <div className="chart-grid">
              <section className="card" aria-labelledby="party-chart-title">
                <div className="card-head">
                  <h2 id="party-chart-title">Amount by party</h2>
                  <p>Select a bar to show only that party. Select it again to show every party.</p>
                </div>
                <RankChart
                  items={parties.map((party) => ({
                    id: party.id,
                    label: party.label,
                    value: party.value,
                    colour: partyColour(party.id),
                    meta: `${formatCount(party.count)} ${party.count === 1 ? "donation" : "donations"} · ${formatShare(party.share)}`,
                  }))}
                  pressedId={focusedParty}
                  onSelect={(id) => setFilters((current) => focusParty(current, id))}
                  empty="No party totals for the current filters."
                />
              </section>

              <section className="card" aria-labelledby="donor-chart-title">
                <div className="card-head">
                  <h2 id="donor-chart-title">Largest donors</h2>
                  <p>
                    {donors.length === 0
                      ? "Donor totals update with the filters."
                      : donors.length < 12
                        ? `All ${formatCount(donors.length)} donors in the current filters, by total given.`
                        : "Top 12 donors by total given. The same name is added together."}
                  </p>
                </div>
                <RankChart
                  items={donors.map((donor) => ({
                    id: donor.id,
                    label: donor.label,
                    value: donor.value,
                    meta: `${formatCount(donor.count)} ${donor.count === 1 ? "donation" : "donations"}${
                      donor.partyCount > 1 ? ` · ${donor.partyCount} parties` : ""
                    }`,
                  }))}
                  pressedId={donors.some((donor) => donor.id === focusedDonor) ? focusedDonor : null}
                  onSelect={(id) => setFilters((current) => focusDonor(current, id))}
                  empty="No donors in the current filters."
                />
                {hiddenDonors > 0 && (
                  <p className="chart-note">
                    {formatCount(hiddenDonors)} other {hiddenDonors === 1 ? "donor is" : "donors are"}{" "}
                    not shown. Search or export the table for the full filtered list.
                  </p>
                )}
              </section>

              <section className="card wide table-card" aria-labelledby="table-title">
                <div className="toolbar">
                  <div>
                    <h2 id="table-title">Donations</h2>
                    <p aria-live="polite">
                      Showing {formatCount(filtered.length)} of {formatCount(donations.length)}{" "}
                      donations
                      {" · "}
                      {rangeLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="export-button"
                    onClick={exportCsv}
                    disabled={sorted.length === 0}
                  >
                    Export CSV
                  </button>
                </div>
                {sorted.length === 0 ? (
                  <div className="empty">
                    <h3>No donations match</h3>
                    <p>
                      {problem ??
                        "Nothing in the published returns matches these filters. Widen the dates or amounts, or reset to the full list."}
                    </p>
                    <button
                      type="button"
                      className="reset-button"
                      onClick={() => setFilters(createDefaultFilters())}
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <DonationsTable
                    rows={sorted}
                    sort={sort}
                    onSort={(key) => setSort((current) => nextSort(current, key))}
                  />
                )}
              </section>

              <section className="card wide" aria-labelledby="time-title">
                <div className="card-head card-head-row">
                  <div>
                    <h2 id="time-title">Donations over time</h2>
                    <p>
                      {timeSeries.grain === "year"
                        ? "Grouped by the year the party received the donation (longer ranges use years so the chart stays readable)."
                        : "Grouped by the month the party received the donation."}
                    </p>
                  </div>
                  <ul className="legend">
                    <li>
                      <i
                        className="swatch swatch-bar"
                        aria-hidden="true"
                        style={
                          focusedParty
                            ? { background: partyColour(focusedParty) }
                            : undefined
                        }
                      />{" "}
                      {timeSeries.grain === "year" ? "Year" : "Month"}
                    </li>
                    <li>
                      <i
                        className="swatch swatch-line"
                        aria-hidden="true"
                        style={
                          focusedParty
                            ? { background: partyColour(focusedParty) }
                            : undefined
                        }
                      />{" "}
                      Cumulative
                    </li>
                  </ul>
                </div>
                <TimeSeries
                  points={timeSeries.points}
                  grain={timeSeries.grain}
                  colour={focusedParty ? partyColour(focusedParty) : undefined}
                />
              </section>

              <ElectionCycles cycles={ELECTION_CYCLE_SUMMARIES} />
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <h2>About this page</h2>
          <p>
            This is an unofficial visualisation of public disclosures. The figures come from the{" "}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              Electoral Commission page for donations exceeding $20,000
            </a>{" "}
            and the{" "}
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              page for donations exceeding $30,000
            </a>
            . Each row is one declared return, with the party name, donor, amount, and dates taken
            from those pages. Duplicate rows across the two sources are removed. Published party-name
            variants are combined where they are the same organisation (for example National, Greens,
            ACT, Te Pāti Māori / Māori Party, NZ First, TOP, and Internet Party / Internet MANA).
          </p>
          <p>
            The list only covers donations that crossed the Commission’s disclosure thresholds. It
            is not a full account of party income. The donor-type control is a heuristic based on
            words in the donor name. PDF links open the Commission’s own return where one was
            published. Party colours follow the{" "}
            <a
              href="https://en.wikipedia.org/wiki/Wikipedia:Index_of_New_Zealand_political_party_meta_attributes"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wikipedia NZ party colour index
            </a>
            .
          </p>
        </div>
      </footer>
      <ScrollToTop />
    </>
  );
}
