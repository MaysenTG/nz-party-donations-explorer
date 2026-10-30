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
import { DonorGroupsModal } from "./components/DonorGroupsModal.tsx";
import { PartyMergesModal } from "./components/PartyMergesModal.tsx";
import { RankChart } from "./components/RankChart.tsx";
import { ScrollToTop } from "./components/ScrollToTop.tsx";
import { TimeSeries } from "./components/TimeSeries.tsx";
import { useMatchMedia } from "./hooks/useMatchMedia.ts";
import { donationsToCsv, downloadCsv } from "./lib/csv.ts";
import {
  ALL_PARTIES,
  activeFilterCount,
  applyFilters,
  applyNamePrivacy,
  createDefaultFilters,
  donations,
  donorCount,
  filterProblem,
  filterRangeLabel,
  donationSeries,
  partyCounts,
  partyTotals,
  sortDonations,
  summarise,
  topDonors,
  partyMergeGroups,
} from "./lib/donations.ts";
import { donorMergeGroups } from "./lib/donorGroups.ts";
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

function stats(
  rows: readonly Donation[],
  options: { groupRelatedDonors?: boolean } = {},
): Stats {
  const base = summarise(rows, options);
  const amounts = rows.filter((row) => !row.party_to_party).map((row) => row.amount);
  return {
    ...base,
    median: median(amounts),
    largest: amounts.length ? Math.max(...amounts) : 0,
  };
}

const INITIAL = readUrlState(window.location.search);

const OVERALL = stats(applyFilters(donations, createDefaultFilters()));
const PAST_INSPECTION_COUNT = donations.filter((row) => row.pastInspection).length;
const PARTY_MERGE_GROUPS = partyMergeGroups();
const DONOR_MERGE_GROUPS = donorMergeGroups();
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

/** Append the focused party so filtered section titles stay clear. */
function titleForParty(base: string, party: string | null): string {
  return party ? `${base} to ${party}` : base;
}

export default function App() {
  const isMobile = useMatchMedia("(max-width: 760px)");
  const [filters, setFilters] = useState<FilterState>(INITIAL.filters);
  // The donor detail modal is never stored in the URL; the donor search query can be.
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
  const [donorGroupsOpen, setDonorGroupsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const problem = filterProblem(filters);
  const groupOpts = useMemo(
    () => ({ groupRelatedDonors: filters.groupRelatedDonors }),
    [filters.groupRelatedDonors],
  );
  const visibleDonations = useMemo(
    () => applyNamePrivacy(donations, filters.withholdOldNames),
    [filters.withholdOldNames],
  );
  const filtered = useMemo(
    () => applyFilters(visibleDonations, filters),
    [visibleDonations, filters],
  );
  const sorted = useMemo(() => sortDonations(filtered, sort), [filtered, sort]);
  const summary = useMemo(() => stats(filtered, groupOpts), [filtered, groupOpts]);
  const partyYears = useMemo(() => partyYearSeries(filtered), [filtered]);
  const multiDonors = useMemo(() => multiPartyDonors(filtered, groupOpts), [filtered, groupOpts]);
  const sizes = useMemo(() => sizeDistribution(filtered), [filtered]);
  const parties = useMemo(() => partyTotals(filtered), [filtered]);
  const donors = useMemo(
    () => topDonors(filtered, TOP_DONOR_LIMIT, groupOpts),
    [filtered, groupOpts],
  );
  const timeSeries = useMemo(() => donationSeries(filtered), [filtered]);
  // Election cycles compare parties side by side, so keep other filters but not party.
  const electionCycles = useMemo(
    () => electionCycleSummaries(applyFilters(visibleDonations, filters, { party: true })),
    [visibleDonations, filters],
  );
  const rangeLabel = useMemo(() => filterRangeLabel(filters), [filters]);
  const partyFacet = useMemo(
    () => partyCounts(applyFilters(visibleDonations, filters, { party: true })),
    [visibleDonations, filters],
  );
  const donorFacetRows = useMemo(
    () => applyFilters(visibleDonations, filters, { donorType: true }),
    [visibleDonations, filters],
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
  const hiddenDonors = Math.max(0, donorCount(filtered, groupOpts) - donors.length);
  const activeFilters = activeFilterCount(filters);

  function exportCsv() {
    downloadCsv("nz-party-donations.csv", donationsToCsv(sorted));
  }

  const filterProps = {
    filters,
    partyCounts: partyFacet,
    donorTypeCounts,
    problem,
    matchCount: filtered.length,
    onChange: setFilters,
    onReset: () => setFilters(createDefaultFilters()),
    onViewDonorGroups: () => setDonorGroupsOpen(true),
  };

  return (
    <>
      <a className="skip" href="#results">
        Skip to results
      </a>
      <header className="site-header">
        <div className="wrap">
          <h1>Who Funds NZ</h1>
          <p className="lede">
            Large donations to New Zealand political parties from Electoral Commission returns.
          </p>
          <p className="source-line">
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_LABEL}
            </a>
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_30K_LABEL}
            </a>
            <span>
              {formatCount(OVERALL.donations)} returns · checked {DATA_RETRIEVED}
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
                  <h2 id="party-chart-title">
                    {focusedParty ? titleForParty("Amount", focusedParty) : "Amount by party"}
                  </h2>
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
                  <h2 id="donor-chart-title">{titleForParty("Largest donors", focusedParty)}</h2>
                  {donors.length > 0 && donors.length >= TOP_DONOR_LIMIT && (
                    <p>
                      Top {TOP_DONOR_LIMIT}
                      {filters.groupRelatedDonors ? " (related names grouped)." : " as filed."}
                    </p>
                  )}
                </div>
                <RankChart
                  items={donors.map((donor) => ({
                    id: donor.id,
                    label: donor.label,
                    value: donor.value,
                    meta: `${formatCount(donor.count)} ${donor.count === 1 ? "return" : "returns"}${
                      donor.partyCount > 1 ? ` · ${donor.partyCount} parties` : ""
                    }${
                      donor.members && donor.members.length > 1
                        ? ` · ${donor.members.length} names as filed`
                        : ""
                    }`,
                    children: donor.members?.map((member) => ({
                      id: member.id,
                      label: member.label,
                      value: member.value,
                      meta: `${formatCount(member.count)} ${
                        member.count === 1 ? "return" : "returns"
                      } · ${member.donorType === "organisation" ? "Organisation" : "Individual"}`,
                    })),
                  }))}
                  pressedId={donors.some((donor) => donor.id === focusedDonor) ? focusedDonor : null}
                  onSelect={(id) => setOpenDonor(id)}
                  empty="No donors for these filters."
                />
                {focusedDonor && (
                  <p className="chart-note">
                    <a className="chart-note-link" href="#table-title">
                      View matching donations
                    </a>
                  </p>
                )}
                {!focusedDonor && hiddenDonors > 0 && (
                  <p className="chart-note">
                    {formatCount(hiddenDonors)} more in the table below.
                  </p>
                )}
              </section>

              <section className="card wide" aria-labelledby="time-title">
                <div className="card-head card-head-row">
                  <div>
                    <h2 id="time-title">{titleForParty("Returns over time", focusedParty)}</h2>
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
                  <h2 id="party-year-title">
                    {focusedParty
                      ? titleForParty("Totals by year", focusedParty)
                      : "Party totals by year"}
                  </h2>
                </div>
                <PartyYearChart series={partyYears} />
              </section>

              <section className="card" aria-labelledby="multi-title">
                <div className="card-head">
                  <h2 id="multi-title">Donors giving to more than one party</h2>
                </div>
                <MultiPartyDonors donors={multiDonors} onOpenDonor={setOpenDonor} />
              </section>

              <section className="card" aria-labelledby="size-title">
                <div className="card-head">
                  <h2 id="size-title">{titleForParty("Return sizes", focusedParty)}</h2>
                </div>
                <SizeChart buckets={sizes} />
              </section>

              <ElectionCycles cycles={electionCycles} />

              <section className="card wide table-card" aria-labelledby="table-title">
                <div className="toolbar">
                  <div>
                    <h2 id="table-title">{titleForParty("All matching returns", focusedParty)}</h2>
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
                    groupRelatedDonors={filters.groupRelatedDonors}
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
            Unofficial view of{" "}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              Electoral Commission
            </a>{" "}
            returns. Each row is one return about one donor. Being listed does not suggest any
            wrongdoing.
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
              <strong>2024 and 2025:</strong> since 2023, parties only report donations above $20,000
              received between 1 January of an election year and the day before election day
              <Ref n={2} />
              <Ref n={1} />. The Commission’s pages name 2023 and 2026 as election years and list no
              returns for 2024 or 2025
              <Ref n={5} />, so charts here show nothing for those years.
            </p>
            <p>
              <strong>What we change:</strong> amounts and donor names as filed (amended figure
              where amended). Party name spellings are merged. Donor names stay as filed in each
              return; an optional “Group related donors” setting can combine curated same-person or
              same-entity spellings in charts and the table. Returned donations are left out of
              totals unless you include them. Party-to-party transfers are listed but left out of
              money totals. Names are shown as filed by default. An optional setting can hide{" "}
              {formatCount(PAST_INSPECTION_COUNT)} individual names on returns older than{" "}
              {INSPECTION_YEARS} years
              <Ref n={6} />. No donor addresses are shown.
            </p>
            <p>
              <strong>Filing quirks:</strong> Two returns list a received date that conflicts with
              the donation date. Each is noted on its row.
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
                View party name merges
              </button>
              {" · "}
              <button type="button" className="text-button" onClick={() => setDonorGroupsOpen(true)}>
                View related donor groups
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
          <details className="footer-fold">
            <summary>
              <span className="footer-fold-title">Related donor groups</span>
              <span className="summary-meta">
                <span className="badge">{DONOR_MERGE_GROUPS.length}</span>
                <span className="when-open">Hide</span>
                <span className="when-closed">Show</span>
              </span>
            </summary>
            <p>
              Used only when “Group related donors” is on. Each return still shows the name as
              filed. Spouses and other family members are not combined.
            </p>
            <ul className="about-list merge-list">
              {DONOR_MERGE_GROUPS.map((group) => (
                <li key={group.id}>
                  <strong>{group.label}</strong>: {group.members.map((m) => `“${m}”`).join(", ")}
                  {group.note ? ` — ${group.note}` : ""}
                </li>
              ))}
            </ul>
          </details>
          <p className="site-notice">
            Independent of the Electoral Commission. Have some feedback? {" "}
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              GitHub issue
            </a>{" "}
            or{" "}
            <a href={PRIVATE_REPORT_URL} target="_blank" rel="noopener noreferrer">
              private report
            </a>
            .
          </p>
        </div>
      </footer>
      <PartyMergesModal open={mergesOpen} onClose={() => setMergesOpen(false)} />
      <DonorGroupsModal open={donorGroupsOpen} onClose={() => setDonorGroupsOpen(false)} />
      <DonorDetail
        name={openDonor}
        sourceRows={filtered}
        groupRelatedDonors={filters.groupRelatedDonors}
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
