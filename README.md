# NZ party donations explorer

Unofficial, single-page visualisation of political party donations exceeding $20,000 declared to the Electoral Commission of New Zealand since 1 January 2026.

This is not an Electoral Commission website. It does not add, estimate, or merge donations. Every row comes from the Commission’s published returns.

## Run

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Other scripts:

```bash
npm run build    # typecheck and production build
npm run preview  # serve the production build
npm run lint
```

## Data

Source: [Donations exceeding $20,000](https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000) (Elections NZ / the Electoral Commission).

`src/data/donations.json` is the app’s source of truth: a scrape of that page. The current file has 124 returns. Each record includes:

- party
- donor name and address
- amount in NZD
- the date the party received the donation
- the date the Commission received the return
- a link to the official PDF return, when published

Figures are **declared donations over $20,000 only**. Smaller donations are not in this dataset. Party names are kept exactly as published. In particular, “Opportunity Party” and “The Opportunities Party” are separate strings in the source and are not combined.

The donor-type filter is a **heuristic**, not an official classification. A donor is treated as an organisation when the name contains a word such as Ltd, Limited, Trust, Union, Incorporated, Holdings, Group, Party, Estate, Partnership, or similar. Everyone else is treated as an individual, including joint personal names.

## What you can do

- Read the total amount, number of donations, number of parties, and number of unique donors. The figures follow the current filters.
- Filter by party, the date the party received the donation, amount, donor name or address, and the individual/organisation heuristic. Filters combine.
- Sort the table and export the filtered rows as CSV.
- Compare party totals, the largest donors in the current filter, and donations by month. Select a party bar to filter to that party; select a donor bar to search for that name.
