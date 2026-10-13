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
import { ELECTION_CYCLE_SUMMARIES } from "./lib/elections.ts";
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
            Large donations to registered parties, as published by the Electoral Commission. The
            reporting threshold has changed over time: over $20,000 (2008 to 2010), over $30,000
            (2011 to 2022), and over $20,000 from 2023. Smaller donations are not included.
          </p>
          <p className="source-line">
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_LABEL}
            </a>
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_30K_LABEL}
            </a>
            <span>
              {formatCount(donations.length)} returns filed {formatIsoLong(RETURN_MIN)} to{" "}
              {formatIsoLong(RETURN_MAX)} · checked against the Commission on {DATA_RETRIEVED}
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
                    {hiddenDonors === 1 ? "donor is" : "donors are"} in the table below.
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

              <ElectionCycles cycles={ELECTION_CYCLE_SUMMARIES} />

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
              Electoral Commission page for donations exceeding $20,000
            </a>{" "}
            and the{" "}
            <a href={SOURCE_30K_URL} target="_blank" rel="noopener noreferrer">
              page for donations exceeding $30,000
            </a>
            . Each row is one return a party filed about one donor. A return can add up several
            donations from that donor. The data was last checked against the Commission on{" "}
            {DATA_RETRIEVED}.
          </p>
          <p>
            <strong>Years covered:</strong> returns over $20,000 for 2008 to 2010, over $30,000 for
            2011 to 2022, and over $20,000 for 2023 and 2026. The Commission publishes no table of
            these returns for 2024 or 2025, so those years are empty. Smaller donations appear only
            in party annual returns, which this site does not use. The two Commission pages cover
            different years, so no return appears twice.
          </p>
          <p>
            <strong>What we change:</strong> Amounts and donor names are shown as filed, using the
            amended figure where a return was amended. We do not estimate any figure. We do make
            these changes:
          </p>
          <ul className="about-list">
            <li>
              Party names (the only names we merge). The same party is sometimes labelled in different ways, so these variants
              are merged into one name. Every merge is listed below. Any party name not listed is
              shown as published.
            </li>
            <li>
              Dates. Where a return adds up several donations, the date shown is the latest donation
              date in that return, and the charts place the whole amount in that month or year. Some
              of these returns include parts from 2007. For two returns (Hon Robert Smellie QC, 2020,
              and NZ Public Party, 2020) the Commission lists dates with no year, so the date shown is
              the date the return was filed.
            </li>
            <li>
              Returned donations. The Commission notes that 2 donations in 2023 were given back to
              the donor (Buen Holdings Limited to National, Z A Unkovich to NZ First). They are
              flagged and left out of totals unless you include them in the filters.
            </li>
            <li>
              Notes. Other Commission notes are shown on the row: amended return dates, a withdrawn
              amendment, an extra $15,200 noted on one return, and rows where the donor is itself a
              registered party (Internet Party to Internet MANA in 2014, Vision New Zealand to
              Freedoms New Zealand in 2023).
            </li>
            <li>
              Donor names are shown exactly as filed. We do not merge donor names, so one donor
              can appear under more than one spelling, and each spelling counts as a separate
              name. The only change is that the HTML code “&amp;amp;” in four names is shown as “&amp;”.
            </li>
            <li>
              Donor type (individual or organisation) is our guess from words in the name, such as
              Limited or Trust, plus a short list checked by hand. It is not an official label.
            </li>
            <li>
              Older returns. Returns are open for public inspection for {INSPECTION_YEARS} years.
              After that we do not name individual donors, or organisations whose listed name
              includes a person: {formatCount(WITHHELD_COUNT)} rows show “Name withheld (return
              over 6 years old)” instead. Their amounts and parties stay
              in the totals. Organisations stay named. The donor view only lists returns from the
              last {INSPECTION_YEARS} years.
            </li>
            <li>We do not show donor addresses. The official return for each row has the full record.</li>
            <li>
              Party colours come from the{" "}
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
            Internet MANA was a separate combined party registered for the 2014 election, so it is
            shown on its own.{" "}
            <button type="button" className="text-button" onClick={() => setMergesOpen(true)}>
              Open merge list
            </button>
          </p>
          <p>
            Being listed means only that a party reported receiving a donation. It does not suggest
            any wrongdoing by the donor or the party.
          </p>
          <p className="site-notice">
            <strong>Notice:</strong> Data source is the Electoral Commission. This site is
            independent and is not affiliated with or endorsed by the Electoral Commission. If
            something here does not match the official record, please{" "}
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              open a public issue on GitHub
            </a>{" "}
            with only the row and the correction, and no personal details. If the correction is
            about you or is private, use{" "}
            <a href={PRIVATE_REPORT_URL} target="_blank" rel="noopener noreferrer">
              GitHub’s private report form
            </a>
            , which only the site owner can read. Neither route needs an email address or phone
            number.
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
