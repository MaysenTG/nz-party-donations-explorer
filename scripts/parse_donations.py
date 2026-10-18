#!/usr/bin/env python3
"""Parse saved elections.nz donation pages and list returns missing from src/data/donations.json.

Usage: python3 scripts/parse_donations.py [--apply]
Reads raw/page-20000.html (2026 and since-2023 tables). Matches on donor name as filed,
party (after PARTY_ALIASES), amount and return received date. Prints new rows as JSON.
--apply appends them to the top of src/data/donations.json. Never edits existing rows.
Needs: pip install beautifulsoup4
"""
import json, re, sys, datetime, html, pathlib
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "src/data/donations.json"
src = (ROOT / "src/lib/donations.ts").read_text()
seg = src[src.index("PARTY_ALIASES"):src.index("};", src.index("PARTY_ALIASES"))]
ALIASES = dict(re.findall(r'"([^"]+)": "([^"]+)"', seg))

def party(p): return ALIASES.get(p, p)
def pdate(s):
    s = s.strip().rstrip(".,")
    for f in ("%d %B %Y", "%d %b %Y"):
        try: return datetime.datetime.strptime(s, f).date()
        except ValueError: pass
def fmt(d): return f"{d.day} {d.strftime('%B %Y')}"
def clean(s): return html.unescape(s).replace("\xa0", " ").strip()

def parse_20k(path):
    out = []
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "html.parser")
    for t in soup.find_all("table"):
        for r in t.find_all("tr")[1:]:
            tds = r.find_all("td")
            if len(tds) < 3: continue
            c0 = clean(tds[0].get_text(" ", strip=True))
            m = re.match(r"(.*?)\s+(\d{1,2} \w+ \d{4})(.*)$", c0)
            c2 = clean(tds[2].get_text(" ", strip=True))
            a = re.match(r"\$([\d,\.]+),?\s+(\d{1,2} \w+ \d{4})(.*)$", c2)
            if not (m and a):
                print("UNPARSED:", c0, "|", c2, file=sys.stderr); continue
            links = [x["href"] for x in r.find_all("a", href=True)]
            links = ["https://elections.nz" + h if h.startswith("/") else h for h in links]
            amt = float(a.group(1).replace(",", ""))
            out.append(dict(
                party=m.group(1).strip(), return_received_date=pdate(m.group(2)),
                donor_name=clean(list(tds[1].stripped_strings)[0]),  # first line only: no address
                amount=int(amt) if amt.is_integer() else amt,
                donation_received_date=pdate(a.group(2)),
                source_pdf_url=links[-1] if links else "",
                note=re.sub(r"\((PDF|JPG)[^)]*\)", "", m.group(3) + " " + a.group(3)).strip()))
    return out

def main():
    data = json.load(open(DATA, encoding="utf-8"))
    have = {}
    for x in data:
        k = (x["donor_name"].strip().lower(), party(x["party"]), round(float(x["amount"]), 2), pdate(x["return_received_date"]))
        have[k] = have.get(k, 0) + 1
    urls = {x.get("source_pdf_url") for x in data if x.get("source_pdf_url")}
    new = []
    for o in parse_20k(ROOT / "raw/page-20000.html"):
        k = (o["donor_name"].lower(), party(o["party"]), round(float(o["amount"]), 2), o["return_received_date"])
        if have.get(k): have[k] -= 1; continue
        if o["source_pdf_url"] in urls:
            # Same return already stored under a different shape (for example a two-donor cell).
            print("EXISTS BY URL, CHECK BY HAND:", o["donor_name"], o["source_pdf_url"], file=sys.stderr); continue
        new.append(o)
    rows = [dict(party=party(o["party"]), return_received_date=fmt(o["return_received_date"]),
                 donor_name=o["donor_name"], amount=o["amount"],
                 donation_received_date=fmt(o["donation_received_date"]),
                 source_pdf_url=o["source_pdf_url"]) for o in new]
    for o in new:
        if o["note"]: print("CHECK NOTE (amended/multi?):", o["donor_name"], o["note"], file=sys.stderr)
    print(json.dumps(rows, indent=2, ensure_ascii=False))
    if "--apply" in sys.argv and rows:
        DATA.write_text(json.dumps(rows + data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Added {len(rows)} rows", file=sys.stderr)

if __name__ == "__main__":
    main()
