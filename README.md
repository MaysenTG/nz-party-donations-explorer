# NZ party donations explorer

An unofficial, single-page look at political party donations over $20,000 declared to the Electoral Commission of New Zealand, covering every year the Commission publishes in its donation tables (2008 to 2022, 2023 and 2026).

This is an independent project. It is not an Electoral Commission website and is not affiliated with or endorsed by the Electoral Commission. Amounts, dates and donor names are shown as filed. Some things are changed for display, such as merging party name variants. See [Merges and other changes](#merges-and-other-changes).

## Contents

1. [Live site](#live-site)
2. [What you can do](#what-you-can-do)
3. [About the data](#about-the-data)
4. [Merges and other changes](#merges-and-other-changes)
5. [Corrections](#corrections)

## Live site

https://maysentg.github.io/nz-party-donations-explorer/

## What you can do

- See the total amount, number of donations, parties, and unique donors (all update with your filters).
- Filter by party, date received, amount, donor name, and whether a donor looks like an individual or an organisation.
- Sort the table and export the filtered rows as CSV.
- Compare party totals, the largest donors, and donations by month. Click a party or donor bar to filter to that selection.

## About the data

Source: [Donations exceeding $20,000](https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000) from Elections NZ / the Electoral Commission.

The app reads from [`src/data/donations.json`](src/data/donations.json), a scrape of that page and the linked $30,000 page (currently 517 returns: 244 from 2008 to 2022, 131 from the 2023 table and 142 from the 2026 table). Each record includes the party, donor name, amount in NZD, the date the party received the donation, the date the Commission received the return, and a link to the official PDF when available. The data file also holds the donor address as published, but the site build strips it out, so addresses are not shown, searchable, exported or shipped to the browser. Use the official return to see the full record.

A few things to keep in mind:

- Only **declared donations over $20,000** are included. Smaller donations are not in this dataset.
- The individual/organisation filter is a **heuristic**, not an official label. Names with words like Ltd, Trust, Union, or Incorporated are treated as organisations; everything else is treated as an individual.
- Years covered: $20,000 returns for 2008 to 2010, $30,000 returns for 2011 to 2022, and $20,000 returns from the Commission's 2023 and 2026 tables. The Commission publishes no donation table for 2024 or 2025, so those years are empty here. Donations in those years appear only in each party's annual return PDF, which this project does not include.

## Merges and other changes

Amounts, dates and donor names are not estimated or adjusted. They are as filed with the Commission. These are the changes the site makes:

**Party name merges.** These raw party names are shown under one name (from `PARTY_ALIASES` in [`src/lib/donations.ts`](src/lib/donations.ts)):

| Raw party name in a return | Shown as |
| --- | --- |
| The ACT Party | ACT New Zealand |
| The Act Party | ACT New Zealand |
| New Zealand National Party | The New Zealand National Party |
| The Greens, Green Party | The Green Party of Aotearoa New Zealand |
| The Green Party of Aotearoa NZ | The Green Party of Aotearoa New Zealand |
| Green Party of Aotearoa New Zealand | The Green Party of Aotearoa New Zealand |
| The Green Party of Aotearoa | The Green Party of Aotearoa New Zealand |
| Green Party of Aoteroa New Zealand (a misspelling in one 2023 row) | The Green Party of Aotearoa New Zealand |
| Green Party | The Green Party of Aotearoa New Zealand |
| Māori Party | Te Pāti Māori |
| Maori Party | Te Pāti Māori |
| New Zealand First | New Zealand First Party |
| Opportunity Party | The Opportunities Party |
| The Opportunities Party (TOP) | The Opportunities Party |
| Internet MANA | Internet Party |

Internet MANA was the 2014 alliance between the Internet Party and Mana. Any party name not in this table is shown as published.

**Other changes:**

- Rows that appear on both the $20,000 and $30,000 pages are only counted once.
- Donor type (individual or organisation) is a guess from words in the name. It is not an official label.
- Donor addresses are removed from the site build.
- Party colours come from the Wikipedia NZ party colour index.

## Corrections

If something here does not match the official record, please [open an issue on GitHub](https://github.com/MaysenTG/nz-party-donations-explorer/issues). Please do not post personal details in a public issue. If the official record itself is wrong, the party needs to file an amended return with the Electoral Commission.
