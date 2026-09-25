import { useMemo, useState } from "react";
import { ActiveFilters } from "./components/ActiveFilters.tsx";
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
} from "./lib/donations.ts";
import { donorBlurb } from "./lib/donors.ts";
import { ELECTION_CYCLE_SUMMARIES } from "./lib/elections.ts";
import { formatCount, formatShare } from "./lib/format.ts";
import { partyColour } from "./lib/parties.ts";
import {
  DONATIONS_JSON_URL,
  SOURCE_30K_LABEL,
  SOURCE_30K_URL,
  SOURCE_LABEL,
  SOURCE_URL,
} from "./lib/source.ts";
import type { DonorTypeFilter, Filters as FilterState, SortKey, SortState } from "./types.ts";

const OVERALL = summarise(donations);
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

function focusDonor(filters: FilterState, name: string): FilterState {
  const query = filters.query.trim() === name ? "" : name;
  return { ...filters, query };
}

export default function App() {
  const isMobile = useMatchMedia("(max-width: 760px)");
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters);
  const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });
  const [mergesOpen, setMergesOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const problem = filterProblem(filters);
  const filtered = useMemo(() => applyFilters(donations, filters), [filters]);
  const sorted = useMemo(() => sortDonations(filtered, sort), [filtered, sort]);
  const summary = useMemo(() => summarise(filtered), [filtered]);
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
        <ExploreBar
          filters={filters}
          summary={summary}
          overall={OVERALL}
          rangeLabel={rangeLabel}
          onChange={setFilters}
        />

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
                        : `Top ${TOP_DONOR_LIMIT} by exact published name. Select to search.`}
                  </p>
                </div>
                <RankChart
                  items={donors.map((donor) => ({
                    id: donor.id,
                    label: donor.label,
                    value: donor.value,
                    blurb: donorBlurb(donor.label),
                    meta: `${formatCount(donor.count)} ${donor.count === 1 ? "donation" : "donations"}${
                      donor.partyCount > 1 ? ` · ${donor.partyCount} parties` : ""
                    }`,
                  }))}
                  pressedId={donors.some((donor) => donor.id === focusedDonor) ? focusedDonor : null}
                  onSelect={(id) => setFilters((current) => focusDonor(current, id))}
                  empty="No donors for these filters."
                />
                {focusedDonor && (
                  <p className="chart-note">
                    Search matches names and addresses containing “{focusedDonor}”. Bars only total
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
                    <a
                      className="data-link"
                      href={DONATIONS_JSON_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View raw data
                    </a>
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
            . Each row is one declared return. Duplicates across both lists are removed.
          </p>
          <p>
            <strong>Party names:</strong> Returns sometimes use different labels for the same party.
            Variants are merged for charts and filters — for example ACT (“The ACT Party” / “The Act
            Party”), National (“New Zealand National Party”), Greens (several short forms), NZ First
            (“New Zealand First”), Te Pāti Māori (including older “Māori Party” / “Maori Party”
            wording), and The Opportunities Party (including “Opportunity Party” and “TOP”). Returns
            labelled “Internet MANA” (the 2014 Internet Party–Mana alliance) are grouped with the
            Internet Party. Other names stay as published.{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => setMergesOpen(true)}
            >
              View merge list
            </button>
          </p>
          <p>
            <strong>Why 2023–2025 look empty:</strong> Sources cover the $30,000 list (mainly
            2011–2022, plus older 2008–2010 disclosures) and current $20,000 continuous disclosures
            for the 2026 election year. Those middle years are not in the source files — not because
            nothing was given. Under today’s rules, continuous $20,000 disclosures are mainly
            required in election years.
          </p>
          <p>
            Only donations above the Commission’s thresholds appear here — not full party income.
            Donor type is a name-based guess. PDF links open the Commission return where published.
            Party colours follow the{" "}
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
      <PartyMergesModal open={mergesOpen} onClose={() => setMergesOpen(false)} />
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
