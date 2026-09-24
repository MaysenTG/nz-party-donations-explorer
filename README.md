# NZ party donations explorer

An unofficial, single-page look at political party donations over $20,000 declared to the Electoral Commission of New Zealand since 1 January 2026.

This is not an Electoral Commission website. Nothing here is estimated or merged — every row comes straight from the Commission’s published returns.

## Contents

1. [Live site](#live-site)
2. [What you can do](#what-you-can-do)
3. [About the data](#about-the-data)

## Live site

https://maysentg.github.io/nz-party-donations-explorer/

## What you can do

- See the total amount, number of donations, parties, and unique donors (all update with your filters).
- Filter by party, date received, amount, donor name or address, and whether a donor looks like an individual or an organisation.
- Sort the table and export the filtered rows as CSV.
- Compare party totals, the largest donors, and donations by month. Click a party or donor bar to filter to that selection.

## About the data

Source: [Donations exceeding $20,000](https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000) from Elections NZ / the Electoral Commission.

The app reads from [`src/data/donations.json`](src/data/donations.json) — a scrape of that page (currently 124 returns). Each record includes the party, donor name and address, amount in NZD, the date the party received the donation, the date the Commission received the return, and a link to the official PDF when available.

A few things to keep in mind:

- Only **declared donations over $20,000** are included. Smaller donations are not in this dataset.
- Party names are kept exactly as published — for example, “Opportunity Party” and “The Opportunities Party” stay separate.
- The individual/organisation filter is a **heuristic**, not an official label. Names with words like Ltd, Trust, Union, or Incorporated are treated as organisations; everything else is treated as an individual.
