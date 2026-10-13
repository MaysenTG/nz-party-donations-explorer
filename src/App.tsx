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
  RECEIVED_MAX,
  RECEIVED_MIN,
  sortDonations,
  summarise,
  topDonors,
  partyMergeGroups,
} from "./lib/donations.ts";
import { ELECTION_CYCLE_SUMMARIES } from "./lib/elections.ts";
import { formatCount, formatShare } from "./lib/format.ts";
import { partyColour } from "./lib/parties.ts";
import {
  SOURCE_30K_LABEL,
  SOURCE_30K_URL,
  SOURCE_LABEL,
  SOURCE_URL,
  CONTACT_URL,
} from "./lib/source.ts";
import type {
  Donation,
  DonorTypeFilter,
  Filters as FilterState,
  SortKey,
  SortState,
} from "./types.ts";

function stats(rows: readonly Donation[]): Stats {
  const base = summarise(rows);
  const amounts = rows.map((row) => row.amount);
  return {
    ...base,
    median: median(amounts),
    largest: amounts.length ? Math.max(...amounts) : 0,
  };
}

const INITIAL = readUrlState(window.location.search);

const OVERALL = stats(donations);
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
  const [openDonor, setOpenDonor] = useState<string | null>(INITIAL.donor);

  // Keep the URL in step with filters so a view can be shared or bookmarked.
  useEffect(() => {
    const next = writeUrlState(filters, openDonor);
    if (next !== window.location.search) {
      window.history.replaceState(null, "", `${window.location.pathname}${next}${window.location.hash}`);
    }
  }, [filters, openDonor]);

  useEffect(() => {
    function onPop() {
      const state = readUrlState(window.location.search);
      setFilters(state.filters);
      setOpenDonor(state.donor);
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
          <p className="eyebrow">Elections NZ disclosures · unofficial view</p>
          <h1>Declared party donations</h1>
          <p className="lede">
            Gifts declared to the Electoral Commission above today’s $20,000 threshold, plus older
            $30,000 returns. Smaller gifts are not included.
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
        <ExploreBar filters={filters} onChange={setFilters} />
        <StatCards stats={summary} overall={OVERALL} />

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
                    meta: `${formatCount(party.count)} ${party.count === 1 ? "donation" : "donations"} · ${formatShare(party.share)}`,
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
                        : `Top ${TOP_DONOR_LIMIT} by exact published name. Select one for details.`}
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
                    {hiddenDonors === 1 ? "donor is" : "donors are"} in the table below.
                  </p>
                )}
              </section>

              <section className="card wide" aria-labelledby="time-title">
                <div className="card-head card-head-row">
                  <div>
                    <h2 id="time-title">Donations over time</h2>
                    <p>
                      By {timeSeries.grain === "year" ? "year" : "month"} received
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
                    {formatCount(multiDonors.length)} exact donor{" "}
                    {multiDonors.length === 1 ? "name" : "names"} in range. Select one to see every
                    donation under that name.
                  </p>
                </div>
                <MultiPartyDonors donors={multiDonors} onOpenDonor={setOpenDonor} />
              </section>

              <section className="card" aria-labelledby="size-title">
                <div className="card-head">
                  <h2 id="size-title">Donation sizes</h2>
                  <p>How many declared donations fall in each size band.</p>
                </div>
                <SizeChart buckets={sizes} />
              </section>

              <ElectionCycles cycles={ELECTION_CYCLE_SUMMARIES} />

              <section className="card wide table-card" aria-labelledby="table-title">
                <div className="toolbar">
                  <div>
                    <h2 id="table-title">All matching donations</h2>
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
                    <h3>No donations match</h3>
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
            Unofficial view of public disclosures from the{" "}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              Electoral Commission page for donations exceeding $20,000
            </a>{" "}
            and the{" "}
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              page for donations exceeding $30,000
            </a>
            . Each row is one declared return.
          </p>
          <p>
            <strong>What we change:</strong> Amounts, dates and donor names are shown as filed with
            the Commission. We do not estimate or adjust any figure. We do make these changes:
          </p>
          <ul className="about-list">
            <li>
              Party names. Returns sometimes label the same party in different ways, so we merge
              these variants into one name for charts, filters and the table. Every merge is listed
              below. Any party name not listed is shown as published.
            </li>
            <li>Rows that appear on both the $20,000 and $30,000 pages are only counted once.</li>
            <li>
              Donor type (individual or organisation) is our guess from words in the name, such as
              Limited or Trust. It is not an official label.
            </li>
            <li>We do not show donor addresses. The official return for each row has the full record.</li>
            <li>Party colours come from the{" "}
              <a
                href="https://en.wikipedia.org/wiki/Wikipedia:Index_of_New_Zealand_political_party_meta_attributes"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wikipedia NZ party colour index
              </a>
              .
            </li>
          </ul>
          <h3>Party name merges</h3>
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
            “Internet MANA” was the 2014 alliance between the Internet Party and Mana. Those returns
            are grouped under Internet Party.{" "}
            <button type="button" className="text-button" onClick={() => setMergesOpen(true)}>
              Open merge list
            </button>
          </p>
          <p>
            <strong>Years covered:</strong> This page uses the $30,000 list (mainly 2011 to 2022,
            plus some 2008 to 2010 disclosures) and the $20,000 returns for 2026. The Commission
            also publishes a table of $20,000 returns from 2023, which this page does not include
            yet. So 2023 to 2025 look empty here even though returns exist for that period.
          </p>
          <p>
            Only donations above the Commission’s thresholds appear here, so this is not a party’s
            full income. Being listed means only that a party reported receiving a donation. It
            does not suggest any wrongdoing by the donor or the party.
          </p>
          <p className="site-notice">
            <strong>Notice:</strong> Data source is the Electoral Commission. This site is
            independent and is not affiliated with or endorsed by the Electoral Commission. If
            something here does not match the official record, please{" "}
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              report it on GitHub
            </a>
            . Please do not post personal details in a public issue.
          </p>
        </div>
      </footer>
      <PartyMergesModal open={mergesOpen} onClose={() => setMergesOpen(false)} />
      <DonorDetail
        name={openDonor}
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
