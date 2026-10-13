# NZ party donations explorer

An unofficial explorer of large party donations published by the Electoral Commission of New Zealand: returns over $20,000 for 2008 to 2010, over $30,000 for 2011 to 2022, and over $20,000 from 2023 (the Commission's 2023 and 2026 tables).

This is an independent project. It is not an Electoral Commission website and is not affiliated with or endorsed by the Electoral Commission. Amounts and donor names are shown as filed, using the amended figure where a return was amended. Only party names are merged; donor names are never merged. See [Merges and other changes](#merges-and-other-changes).

## Contents

1. [Live site](#live-site)
2. [What you can do](#what-you-can-do)
3. [About the data](#about-the-data)
4. [Merges and other changes](#merges-and-other-changes)
5. [Privacy](#privacy)
6. [Polling day mode](#polling-day-mode)
7. [Corrections](#corrections)

## Live site

https://maysentg.github.io/nz-party-donations-explorer/

## What you can do

- See the total amount, number of returns, parties and distinct donor names as filed (all update with your filters).
- Filter by party, donation date, amount, donor name, and whether a donor looks like an individual or an organisation.
- Sort the table and export the filtered rows as CSV.
- Compare party totals, the largest donor names, party totals by year, donor names that gave to more than one party, and return sizes.
- Select a party bar to focus that party. Select a donor to see their returns from the last 6 years.

## About the data

Source: [Donations exceeding $20,000](https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000) and the linked [Donations exceeding $30,000](https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000/donations-exceeding-30000) page, published by the Electoral Commission. Last checked against the Commission on 13 October 2026.

The app reads [`src/data/donations.json`](src/data/donations.json), built from those pages (currently 517 returns: 244 from 2008 to 2022, 131 from the 2023 table and 142 from the 2026 table). The threshold depends on the year: see Years covered below.

Each row is one return a party filed about one donor. A return can add up several donations from that donor. Each record has:

| Field | Meaning |
| --- | --- |
| `party` | Party name, already merged (see below) |
| `donor_name` | Donor name as published |
| `amount` | Return total in NZD (the amended figure if amended) |
| `donation_received_date` | The latest donation date in the return |
| `return_received_date` | Date the Commission received the return |
| `amended_return_received_date` | Optional. Date an amended return was received |
| `returned_to_donor` | Optional. The Commission notes the party gave the donation back |
| `party_to_party` | Optional. The donor is itself a registered party |
| `notes` | Optional. Notes from the Commission's tables |
| `source_pdf_url` | Link to the official return, when the Commission publishes one |

The data file does not hold donor addresses. Use the official return to see the full record.

Things to keep in mind:

- Only returns over the threshold for their year are included. Smaller donations are not in this dataset.
- Years covered: returns over $20,000 for 2008 to 2010, over $30,000 for 2011 to 2022, and over $20,000 for 2023 and 2026. The Commission publishes no table of these returns for 2024 or 2025, so those years are empty here. Smaller donations appear only in each party's annual return, which this project does not use. The two Commission pages cover different years, so no return appears twice.
- Dates. Where a return adds up several donations, `donation_received_date` is the latest one, and charts place the whole amount there. Some of these returns include parts from 2007. For two 2020 returns (Hon Robert Smellie QC and NZ Public Party) the Commission lists dates without a year, so the date stored is the date the return was filed. Each is noted on the row.
- The individual or organisation label is a heuristic, not an official label. Names with words like Ltd, Trust, Union, Bank or Vineyard are treated as organisations, plus a short override list in [`src/lib/donors.ts`](src/lib/donors.ts). Everything else is treated as an individual.

## Merges and other changes

**Party name merges.** These party names, as they appear in the Commission's tables, are shown under one name (from `PARTY_ALIASES` in [`src/lib/donations.ts`](src/lib/donations.ts)). The data file stores the merged name.

| Party name in the Commission's table | Shown as |
| --- | --- |
| The ACT Party | ACT New Zealand |
| The Act Party | ACT New Zealand |
| New Zealand National Party | The New Zealand National Party |
| The Greens, Green Party of Aotearoa New Zealand | The Green Party of Aotearoa New Zealand |
| The Green Party of Aotearoa NZ | The Green Party of Aotearoa New Zealand |
| Green Party of Aotearoa New Zealand | The Green Party of Aotearoa New Zealand |
| The Green Party of Aotearoa | The Green Party of Aotearoa New Zealand |
| Green Party of Aoteroa New Zealand | The Green Party of Aotearoa New Zealand |
| Green Party | The Green Party of Aotearoa New Zealand |
| Māori Party | Te Pāti Māori |
| Maori Party | Te Pāti Māori |
| New Zealand First | New Zealand First Party |
| Opportunity Party | The Opportunities Party |
| The Opportunities Party (TOP) | The Opportunities Party |

Internet MANA was a separate combined party registered for the 2014 election, so it is kept apart from the Internet Party. Any party name not in this table is shown as published.

**Donor names are not merged.** Only party names are merged. Donor names are kept exactly as filed in the Commission's tables, so one donor can appear under more than one spelling (for example with or without a middle name), and the donor count counts distinct names as filed. The only change to donor names is decoding the HTML entity `&amp;` to `&` in four names (the Christopher & Banks names and EPMU).

**Other changes:**

- Returned donations. The Commission notes 2 donations in 2023 that the party gave back to the donor (Buen Holdings Limited to National, $200,000; Z A Unkovich to NZ First, $50,000). They are flagged and left out of totals unless the "Include donations returned to the donor" filter is on.
- Party donors. Two donors are themselves parties (Internet Party to Internet MANA, 2014; Vision New Zealand to Freedoms New Zealand, 2023). They are flagged and left out of the "more than one party" list.
- Commission notes (amended return dates, a withdrawn amendment, an extra $15,200 noted on one return) are shown on the row.
- Party colours come from the Wikipedia NZ party colour index.

## Privacy

- Donor addresses are not stored in the data file, and the build would drop the field if it came back. Older commits in this public repository still contain the addresses that were in earlier versions of the file.
- Returns are open for public inspection for 6 years (Electoral Act 1993, s 3). After that the site does not name individual donors, or organisations whose listed name includes a person (via, trustee, directors). Those rows show "Name withheld (return over 6 years old)"; their amounts and parties stay in totals. The cutoff is worked out from the build date (so withheld names are not in the published bundle) and again from the visitor's clock. Rebuild the site from time to time so the bundle keeps up.
- The donor view lists only returns from the last 6 years.
- Donor names are never written to the page URL. The donor view and the donor search box are not saved in shared links.

## Polling day mode

The Electoral Act 1993, s 197(1)(g), bars publishing party names or logos on polling day before voting closes. In polling day mode the site shows only a neutral notice: no party names, colours, charts or data (the data is not even downloaded).

- **Automatic:** the visitor's browser turns the mode on from 00:00 to 19:00 NZDT on Saturday 7 November 2026 (`src/lib/pollingDay.ts`). An open tab reloads itself at the start and end of the window.
- **Build flag:** `VITE_POLLING_DAY=1 npm run build` builds a site that is always in polling day mode, with no reliance on any clock. For a GitHub Pages deploy, set it in the build step on the day and remove it after 7 pm.
- **Check it:** open the site with `?preview=polling-day` to see the notice at any time. To check the automatic window, run `npm run build && npx vite preview` with the system clock set inside the window.

## Corrections

If something here does not match the official record, please [open an issue on GitHub](https://github.com/MaysenTG/nz-party-donations-explorer/issues) with only the row and the correction, and no personal details. If the correction is about you or is private, use [GitHub's private report form](https://github.com/MaysenTG/nz-party-donations-explorer/security/advisories/new), which only the repository owner can read. Neither route needs an email address or phone number. If the official record itself is wrong, the party needs to file an amended return with the Electoral Commission.
