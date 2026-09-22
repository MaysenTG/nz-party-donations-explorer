# NZ party donations explorer

Unofficial, single-page visualisation of political party donations exceeding $20,000 declared to the Electoral Commission of New Zealand since 1 January 2026.

This is not an Electoral Commission website. It does not add, estimate, or merge donations. Every row comes from the Commission’s published returns.

## Live site

https://maysentg.github.io/nz-party-donations-explorer/

Publishing uses GitHub Actions, not a `gh-pages` branch. [`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs on every push to `main` (and from the Actions tab, “Deploy to GitHub Pages”). It installs dependencies, runs `npm run build`, uploads `dist` with `actions/upload-pages-artifact`, and publishes it with `actions/deploy-pages`.

GitHub Pages is not switched on for this repository yet. Creating the site needs repository administration access, and the Actions token is not allowed to do that (`Create Pages site failed: Resource not accessible by integration`). A repository admin needs to set it once:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Re-run the latest “Deploy to GitHub Pages” workflow, or push any commit to `main`.

After that, pushes to `main` publish the site on their own. The app is a single page with no client-side routes, so a `404.html` fallback is not required. Opening or refreshing the URL above loads the explorer.

## Run

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

The dev server uses the GitHub Pages project base path. Open http://localhost:5173/nz-party-donations-explorer/ .

Other scripts:

```bash
npm run build    # typecheck and production build
npm run preview  # serve the production build at /nz-party-donations-explorer/
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
