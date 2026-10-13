# NZ party donations explorer

An unofficial look at political party donations declared to the Electoral Commission of New Zealand.

This is not an Electoral Commission website, and the Commission has not endorsed it. Amounts, donor names, and dates are as filed in the official returns. The site does group some party names, and it estimates whether a donor name looks like an individual or an organisation. Those steps are listed below.

## Contents

1. [Live site](#live-site)
2. [What you can do](#what-you-can-do)
3. [About the data](#about-the-data)
4. [Party names that are merged](#party-names-that-are-merged)
5. [Other changes](#other-changes)
6. [Corrections](#corrections)

## Live site

https://maysentg.github.io/nz-party-donations-explorer/

## What you can do

- See the total amount, number of donations, parties, and unique donors (all update with your filters).
- Filter by party, date received, amount, donor name, and whether a donor name looks like an individual or an organisation.
- Sort the table and export the filtered rows as CSV or JSON. Exports do not include donor addresses.
- Compare party totals, the largest donors, and donations over time. Click a party or donor bar to filter to that selection.
- Open the official Electoral Commission record for each row. Rows with a return PDF link to that PDF. Older rows without a PDF link to the Commission page for that list.

## About the data

Sources:

- [Donations exceeding $20,000](https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000)
- [Donations exceeding $30,000](https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000/donations-exceeding-30000)

The app reads [`src/data/donations.json`](src/data/donations.json). That file can still contain a `donor_address` field from the Commission returns. The site strips the field before display, search, and export. It is not shown in the table, it is not searchable, and it is not included in CSV or JSON downloads.

A few things to keep in mind:

- Only declared donations above the thresholds on those two pages are included. This is not a party's total income.
- This dataset does not include the Commission's donations exceeding $20,000 for 2023, 2024, or 2025. The Commission publishes that table on the $20,000 page (returns since 1 January 2023). Those rows are not loaded here, so those years look empty.
- Amounts are the figures filed in the official returns. They are not estimated or changed.

## Party names that are merged

Published labels sometimes differ for the same party. `PARTY_ALIASES` in [`src/lib/donations.ts`](src/lib/donations.ts) maps the name on the left to the name on the right. Filters, charts, and the table use the name on the right. Any party name not in this list stays as published. The About section on the site renders the same map.

| Published name | Shown as |
| --- | --- |
| The Act Party | ACT New Zealand |
| The ACT Party | ACT New Zealand |
| Internet MANA | Internet Party |
| New Zealand First | New Zealand First Party |
| Maori Party | Te Pāti Māori |
| Māori Party | Te Pāti Māori |
| Green Party | The Green Party of Aotearoa New Zealand |
| Green Party of Aotearoa New Zealand | The Green Party of Aotearoa New Zealand |
| The Green Party of Aotearoa | The Green Party of Aotearoa New Zealand |
| The Green Party of Aotearoa NZ | The Green Party of Aotearoa New Zealand |
| The Greens, Green Party | The Green Party of Aotearoa New Zealand |
| New Zealand National Party | The New Zealand National Party |
| Opportunity Party | The Opportunities Party |
| The Opportunities Party (TOP) | The Opportunities Party |

Internet MANA was the name on 2014 returns for the Internet Party and Mana alliance. Those rows are grouped under Internet Party.

## Other changes

- **Donor type.** Individual or organisation is estimated from the name. It is not an official label. A name is treated as an organisation when it contains one of these words: Ltd, Limited, Trust, Trustee, Union, Incorporated, Holdings, Group, Party, Estate, Foundation, Society, Association, Company, Corporation, Corp, Council, Partners, Partnership, LLP, Inc, Enterprises, Chambers. Everything else is treated as an individual, including joint personal names.
- **Donor grouping on charts.** Largest donors are grouped by the exact name as published. The same person may appear under different spellings, and different people may share a name. Donor names are not merged.
- **Addresses.** Donor addresses from the returns are not shown, searched, or exported. Each row links to the official PDF, or to the Commission page when this dataset has no PDF.
- **Colours.** Party colours follow the [Wikipedia NZ party colour index](https://en.wikipedia.org/wiki/Wikipedia:Index_of_New_Zealand_political_party_meta_attributes). They are not from the Commission.

## Corrections

If something here does not match the official return, open a GitHub issue:

https://github.com/MaysenTG/nz-party-donations-explorer/issues

Please do not include personal details in a public issue.
