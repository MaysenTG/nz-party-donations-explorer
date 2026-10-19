import { useCallback, useEffect, useMemo, useState } from "react";
import { ActiveFilters } from "./components/ActiveFilters.tsx";
import { DonorDetail } from "./components/DonorDetail.tsx";
import { MultiPartyDonors } from "./components/MultiPartyDonors.tsx";
import { PartyYearChart } from "./components/PartyYearChart.tsx";
import { SizeChart } from "./components/SizeChart.tsx";
import { StatCards, type Stats } from "./components/StatCards.tsx";
import { median, multiPartyDonors, partyYearSeries, sizeDistribution } from "./lib/insights.ts";
import { readUrlState, writeUrlState } from "./lib/urlState.ts";
import { DonationsTable } from "./components/DonationsTable.tsx";
import { ElectionCycles } from "./components/ElectionCycles.tsx";
import { ExploreBar } from "./components/ExploreBar.tsx";
import { Filters } from "./components/Filters.tsx";
import { FiltersFab } from "./components/FiltersFab.tsx";
import { FiltersSheet } from "./components/FiltersSheet.tsx";
import { PartyMergesModal } from "./components/PartyMergesModal.tsx";
import { RankChart } from "./components/RankChart.tsx";
import { ScrollToTop } from "./components/ScrollToTop.tsx";
import { TimeSeries } from "./components/TimeSeries.tsx";
import { useMatchMedia } from "./hooks/useMatchMedia.ts";
import { donationsToCsv, downloadCsv } from "./lib/csv.ts";
import { formatIsoLong } from "./lib/dates.ts";
import {
  ALL_PARTIES,
  activeFilterCount,
  applyFilters,
  createDefaultFilters,
  donations,
  donorCount,
  filterProblem,
  filterRangeLabel,
  donationSeries,
  partyCounts,
  partyTotals,
  RETURN_MAX,
  RETURN_MIN,
  sortDonations,
  summarise,
  topDonors,
  partyMergeGroups,
} from "./lib/donations.ts";
import { electionCycleSummaries } from "./lib/elections.ts";
import { QueryBanner } from "./components/QueryBanner.tsx";
import { formatCount, formatShare } from "./lib/format.ts";
import { partyColour } from "./lib/parties.ts";
import {
  SOURCE_30K_LABEL,
  SOURCE_30K_URL,
  SOURCE_LABEL,
  SOURCE_URL,
  CONTACT_URL,
  DATA_RETRIEVED,
  PRIVATE_REPORT_URL,
} from "./lib/source.ts";
import { INSPECTION_YEARS } from "./lib/privacy.ts";
import { Ref, References } from "./components/Ref.tsx";
import type {
  Donation,
  DonorTypeFilter,
  Filters as FilterState,
  SortKey,
  SortState,
} from "./types.ts";

function stats(rows: readonly Donation[]): Stats {
  const base = summarise(rows);
  const amounts = rows.filter((row) => !row.party_to_party).map((row) => row.amount);
  return {
    ...base,
    median: median(amounts),
    largest: amounts.length ? Math.max(...amounts) : 0,
  };
}

const INITIAL = readUrlState(window.location.search);

const OVERALL = stats(applyFilters(donations, createDefaultFilters()));
const WITHHELD_COUNT = donations.filter((row) => row.nameWithheld).length;
const PARTY_MERGE_GROUPS = partyMergeGroups();
const TOP_DONOR_LIMIT = 15;

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

export default function App() {
  const isMobile = useMatchMedia("(max-width: 760px)");
  const [filters, setFilters] = useState<FilterState>(INITIAL.filters);
  // The donor view is never stored in the URL, so shared links do not name a person.
  const [openDonor, setOpenDonor] = useState<string | null>(null);

  // Keep the URL in step with filters so a view can be shared or bookmarked.
  useEffect(() => {
    const next = writeUrlState(filters);
    if (next !== window.location.search) {
      window.history.replaceState(null, "", `${window.location.pathname}${next}${window.location.hash}`);
    }
  }, [filters]);

  useEffect(() => {
    function onPop() {
      const state = readUrlState(window.location.search);
      setFilters(state.filters);
      setOpenDonor(null);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const closeDonor = useCallback(() => setOpenDonor(null), []);
  const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });
  const [mergesOpen, setMergesOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const problem = filterProblem(filters);
  const filtered = useMemo(() => applyFilters(donations, filters), [filters]);
  const sorted = useMemo(() => sortDonations(filtered, sort), [filtered, sort]);
  const summary = useMemo(() => stats(filtered), [filtered]);
  const partyYears = useMemo(() => partyYearSeries(filtered), [filtered]);
  const multiDonors = useMemo(() => multiPartyDonors(filtered), [filtered]);
  const sizes = useMemo(() => sizeDistribution(filtered), [filtered]);
  const parties = useMemo(() => partyTotals(filtered), [filtered]);
  const donors = useMemo(() => topDonors(filtered, TOP_DONOR_LIMIT), [filtered]);
  const timeSeries = useMemo(() => donationSeries(filtered), [filtered]);
  const electionCycles = useMemo(() => electionCycleSummaries(filtered), [filtered]);
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
  const activeFilters = activeFilterCount(filters);

  function exportCsv() {
    downloadCsv("nz-party-donations.csv", donationsToCsv(sorted));
  }

  const filterProps = {
    filters,
    partyCounts: partyFacet,
    donorTypeCounts,
    problem,
    onChange: setFilters,
    onReset: () => setFilters(createDefaultFilters()),
  };

  return (
    <>
      <a className="skip" href="#results">
        Skip to results
      </a>
      <header className="site-header">
        <div className="wrap">
          <p className="eyebrow">Declared party donations · unofficial view</p>
          <h1>Who Funds NZ</h1>
          <p className="lede">
            Large donations to registered New Zealand political parties, from Electoral Commission
            returns. Only amounts above the disclosure threshold are included. Filter by party,
            year, amount or donor.
          </p>
          <p className="source-line">
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_LABEL}
            </a>
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_30K_LABEL}
            </a>
            <span>
              {formatCount(OVERALL.donations)} returns in totals ({formatCount(donations.length)}{" "}
              filed {formatIsoLong(RETURN_MIN)} to {formatIsoLong(RETURN_MAX)}) · checked{" "}
              {DATA_RETRIEVED}
            </span>
          </p>
        </div>
      </header>

      <main className="wrap">
        <StatCards stats={summary} overall={OVERALL} />
        <ExploreBar filters={filters} onChange={setFilters} />

        <div className="layout">
          {!isMobile && (
            <Filters
              {...filterProps}
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
            />
          )}

          <div className="results" id="results">
            <ActiveFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(createDefaultFilters())}
            />
            <QueryBanner
              query={filters.query}
              partyTotals={parties}
              filters={filters}
              onChange={setFilters}
            />

            <div className="chart-grid">
              <section className="card" aria-labelledby="party-chart-title">
                <div className="card-head">
                  <h2 id="party-chart-title">Amount by party</h2>
                  <p>Select a bar to focus one party; select again to clear.</p>
                </div>
                <RankChart
                  items={parties.map((party) => ({
                    id: party.id,
                    label: party.label,
                    value: party.value,
                    colour: partyColour(party.id),
                    meta: `${formatCount(party.count)} ${party.count === 1 ? "return" : "returns"} · ${formatShare(party.share)}`,
                  }))}
                  pressedId={focusedParty}
                  onSelect={(id) => setFilters((current) => focusParty(current, id))}
                  empty="No party totals for these filters."
                />
              </section>

              <section className="card" aria-labelledby="donor-chart-title">
                <div className="card-head">
                  <h2 id="donor-chart-title">Largest donors</h2>
                  <p>
                    {donors.length === 0
                      ? "Updates with the filters."
                      : donors.length < TOP_DONOR_LIMIT
                        ? `All ${formatCount(donors.length)} donors in range.`
                        : `Top ${TOP_DONOR_LIMIT} by amount, by exact name as filed. Select one for returns from the last ${INSPECTION_YEARS} years.`}
                  </p>
                </div>
                <RankChart
                  items={donors.map((donor) => ({
                    id: donor.id,
                    label: donor.label,
                    value: donor.value,
                    meta: `${formatCount(donor.count)} ${donor.count === 1 ? "return" : "returns"}${
                      donor.partyCount > 1 ? ` · ${donor.partyCount} parties` : ""
                    }`,
                  }))}
                  pressedId={donors.some((donor) => donor.id === focusedDonor) ? focusedDonor : null}
                  onSelect={(id) => setOpenDonor(id)}
                  empty="No donors for these filters."
                />
                {focusedDonor && (
                  <p className="chart-note">
                    Search matches donor names containing “{focusedDonor}”. Bars only total
                    exact name matches.{" "}
                    <a className="chart-note-link" href="#table-title">
                      View matching donations
                    </a>
                  </p>
                )}
                {!focusedDonor && hiddenDonors > 0 && (
                  <p className="chart-note">
                    {formatCount(hiddenDonors)} other{" "}
                    {hiddenDonors === 1 ? "donor is" : "donors are"} in the table below (withheld
                    names omitted from this chart).
                  </p>
                )}
              </section>

              <section className="card wide" aria-labelledby="time-title">
                <div className="card-head card-head-row">
                  <div>
                    <h2 id="time-title">Returns over time</h2>
                    <p>
                      By {timeSeries.grain === "year" ? "year" : "month"} of the latest donation
                      date in each return
                      {timeSeries.grain === "year" ? " (long ranges use years)" : ""}.
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

              <section className="card wide" aria-labelledby="party-year-title">
                <div className="card-head">
                  <h2 id="party-year-title">Party totals by year</h2>
                  <p>Largest parties in range shown separately; the rest are grouped.</p>
                </div>
                <PartyYearChart series={partyYears} />
              </section>

              <section className="card" aria-labelledby="multi-title">
                <div className="card-head">
                  <h2 id="multi-title">Donors giving to more than one party</h2>
                  <p>
                    {formatCount(multiDonors.length)}{" "}
                    {multiDonors.length === 1 ? "donor name" : "donor names"} in range, by exact name as
                    filed. Parties listed as donors and individuals on returns over{" "}
                    {INSPECTION_YEARS} years old are left out.
                  </p>
                </div>
                <MultiPartyDonors donors={multiDonors} onOpenDonor={setOpenDonor} />
              </section>

              <section className="card" aria-labelledby="size-title">
                <div className="card-head">
                  <h2 id="size-title">Return sizes</h2>
                  <p>
                    How many returns fall in each size band. A return can total several donations
                    from one donor.
                  </p>
                </div>
                <SizeChart buckets={sizes} />
              </section>

              <ElectionCycles cycles={electionCycles} />

              <section className="card wide table-card" aria-labelledby="table-title">
                <div className="toolbar">
                  <div>
                    <h2 id="table-title">All matching returns</h2>
                    <p aria-live="polite">
                      {formatCount(filtered.length)} of {formatCount(donations.length)} ·{" "}
                      {rangeLabel}
                    </p>
                  </div>
                  <div className="toolbar-actions">
                    <button
                      type="button"
                      className="export-button"
                      onClick={exportCsv}
                      disabled={sorted.length === 0}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
                {sorted.length === 0 ? (
                  <div className="empty">
                    <h3>No returns match</h3>
                    <p>
                      {problem ?? "No matches. Widen dates or amounts, or reset."}
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
                    onOpenDonor={setOpenDonor}
                  />
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer" id="about">
        <div className="wrap">
          <h2>About this page</h2>
          <p>
            Unofficial view of public returns from the{" "}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              Electoral Commission $20,000 page
            </a>{" "}
            and the{" "}
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              $30,000 page
            </a>
            . Each row is one return a party filed about one donor. Last checked against the
            Commission on {DATA_RETRIEVED}. Being listed means only that a party reported receiving
            a donation.
          </p>
          <details className="footer-fold" id="how-the-data-works">
            <summary>
              <span className="footer-fold-title">How the data works</span>
              <span className="summary-meta">
                <span className="when-open">Hide</span>
                <span className="when-closed">Show</span>
              </span>
            </summary>
            <p>
              <strong>Thresholds:</strong> more than $20,000 until 2010
              <Ref n={4} />; more than $30,000 from 2011 to 2022
              <Ref n={3} />; more than $20,000 in election years from 2023 (10 working days in 2023
              <Ref n={2} />, 20 in 2026
              <Ref n={1} />).
            </p>
            <p id="no-2024-2025">
              <strong>Years:</strong> the Commission lists 2008 to 2010, each year from 2011 to 2022,
              then 2023 and 2026
              <Ref n={5} />. It lists none for 2024 or 2025, so charts here show nothing for those
              years.
            </p>
            <p>
              <strong>What we change:</strong> amounts and donor names as filed (amended figure
              where amended). Party name spellings are merged; donor names are not. Returned
              donations are left out of totals unless you include them. Party-to-party transfers are
              listed but left out of money totals. After {INSPECTION_YEARS} years
              <Ref n={6} />, {formatCount(WITHHELD_COUNT)} individual names are withheld. No donor
              addresses are shown.
            </p>
            <p>
              <strong>Filing quirks:</strong> Dinesh Khadka’s return lists a 2010 received date for a
              2020 donation. Alajamber Limited’s July 2026 return lists a received date before the
              donation date. Both notes appear on the row.
            </p>
            <p>
              Party colours from the{" "}
              <a
                href="https://en.wikipedia.org/wiki/Wikipedia:Index_of_New_Zealand_political_party_meta_attributes"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wikipedia NZ party colour index
              </a>
              .{" "}
              <button type="button" className="text-button" onClick={() => setMergesOpen(true)}>
                Party name merges
              </button>
            </p>
          </details>
          <References />
          <details className="footer-fold">
            <summary>
              <span className="footer-fold-title">Party name merges</span>
              <span className="summary-meta">
                <span className="badge">{PARTY_MERGE_GROUPS.reduce((n, g) => n + g.aliases.length, 0)}</span>
                <span className="when-open">Hide</span>
                <span className="when-closed">Show</span>
              </span>
            </summary>
            <ul className="about-list merge-list">
              {PARTY_MERGE_GROUPS.map((group) =>
                group.aliases.map((alias) => (
                  <li key={alias}>
                    “{alias}” is shown as “{group.canonical}”
                  </li>
                )),
              )}
            </ul>
            <p>
              Internet MANA was a separate combined party registered for the 2014 election, so it is
              shown on its own.
            </p>
          </details>
          <p className="site-notice">
            <strong>Notice:</strong> Independent of the Electoral Commission. If something does not
            match the official record,{" "}
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              open a GitHub issue
            </a>{" "}
            with only the row and correction, or use{" "}
            <a href={PRIVATE_REPORT_URL} target="_blank" rel="noopener noreferrer">
              the private report form
            </a>
            .
          </p>
        </div>
      </footer>
      <PartyMergesModal open={mergesOpen} onClose={() => setMergesOpen(false)} />
      <DonorDetail
        name={openDonor}
        sourceRows={filtered}
        onClose={closeDonor}
        onFilterToDonor={(name) => {
          setFilters((current) => ({ ...current, query: name }));
          setOpenDonor(null);
          document.getElementById("table-title")?.scrollIntoView();
        }}
      />
      <FiltersSheet
        {...filterProps}
        open={isMobile && filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
      />
      {!filtersSheetOpen && (
        <FiltersFab activeCount={activeFilters} onOpen={() => setFiltersSheetOpen(true)} />
      )}
      <ScrollToTop />
    </>
  );
}
