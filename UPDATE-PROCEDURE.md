# Updating party donation data

Run this every second day. Repo: MaysenTG/nz-party-donations-explorer. Data lives in `src/data/donations.json` (one object per return row: party, return_received_date, donor_name, amount, donation_received_date, source_pdf_url, plus optional amended_return_received_date, returned_to_donor, party_to_party, notes). No donor addresses or descriptions, ever.

## Sources
- 2026 and 2023 returns over $20,000: https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000
- 2008 to 2022 returns over $30,000: https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000/donations-exceeding-30000
- Annual returns are linked from the political parties section of elections.nz.

## Step 1: save the pages from a browser
curl is blocked by Imperva (Incapsula). Plain requests get a 212 byte stub that loads `_Incapsula_Resource`, and the return PDFs give a 403. Don't try to get around it.

So step 1 is a browser save of the two pages into `raw/`:
- `raw/page-20000.html` from the 20k page (2026 and since-2023 tables)
- `raw/page-30000.html` from the 30k page, with all accordions expanded

The bot check is passed with the normal checkbox or image challenge in the browser. Don't fill in any form asking for a phone number or email. `raw/` is not committed.

## Step 2: run the script
```
pip install beautifulsoup4
python3 scripts/parse_donations.py          # dry run, prints new rows as JSON
python3 scripts/parse_donations.py --apply  # adds them to the top of src/data/donations.json
```
How it works:
- It parses every table on `raw/page-20000.html`. It keeps only the first line of the donor cell, which is the name as filed, so no address goes in.
- It matches rows on donor name, party (after `PARTY_ALIASES` in `src/lib/donations.ts`), amount and return received date. Rows already in the data are skipped. Existing rows are never edited.
- New rows get party, return_received_date, donor_name, amount, donation_received_date and source_pdf_url (the PDF link from the table, even though the PDF itself is blocked).
- The script writes to stderr:
  - `EXISTS BY URL`: the return is already stored under a different shape, for example the Schick two-donor cell. Check it by hand.
  - `CHECK NOTE`: the row has extra text such as "amended". Handle amendments by hand and put them in a separate PR.
- The 2008 to 2022 page has not changed in years. To audit it, use `/workspace/audit/compare_v2.py`: copy the raw files to /tmp/a20.html and /tmp/a30.html and set REPO.

## Rules
- Never alias, group or merge donor names in the JSON. Keep them exactly as filed. Only party names may be merged in the data, and only through `PARTY_ALIASES`. Optional UI grouping of related donors lives in `src/lib/donorGroups.ts` and must not rewrite stored names.
- Keep filed donor names in the JSON. Optional hiding of names older than 6 years is an in-app setting (`src/lib/privacy.ts`), not a build-time strip.
- Update the README count and `DATA_UPDATED` in `src/lib/source.ts`.

## Checks
- `npm ci && npm run build && npm run lint`
- `npm run preview`, then a Playwright screenshot into `shots/`, checking the new rows show up in the table.
- Update the row count in README if it changes. No em dashes in any wording.
- Open a PR from a new branch. No force push, no history rewrite, don't touch gh-pages, don't merge.
