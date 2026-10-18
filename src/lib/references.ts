/** Numbered sources for factual claims on the page. Quotes are copied exactly from the source. */
export type Reference = {
  n: number;
  title: string;
  publisher: string;
  url: string;
  accessed: string;
  quote: string;
};

const P20 =
  "https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000";
const P30 =
  "https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/donations-exceeding-20000/donations-exceeding-30000";
const ACCESSED = "18 October 2026";

export const REFERENCES: Reference[] = [
  {
    n: 1,
    title: "Donations exceeding $20,000",
    publisher: "Electoral Commission",
    url: P20,
    accessed: ACCESSED,
    quote:
      "For 2026, registered political parties have to let us know within 20 working days when they get more than $20,000 from a single donor between 1 January of election year and the day before election day.",
  },
  {
    n: 2,
    title: "Donations exceeding $20,000",
    publisher: "Electoral Commission",
    url: P20,
    accessed: ACCESSED,
    quote:
      "The timeframe is different to the last election. In 2023, registered political parties had to let us know within 10 working days when they got more than $20,000 from a single donor between 1 January of election year and the day before election day.",
  },
  {
    n: 3,
    title: "Donations exceeding $30,000",
    publisher: "Electoral Commission",
    url: P30,
    accessed: ACCESSED,
    quote:
      "From 1 January 2011 to 31 December 2022, registered political parties had to let us know within 10 working days when they got more than $30,000 from a single donor within a 12-month period.",
  },
  {
    n: 4,
    title: "Donations exceeding $30,000",
    publisher: "Electoral Commission",
    url: P30,
    accessed: ACCESSED,
    quote:
      "Until 2010, registered political parties had to let us know when they got more than $20,000 from a single donor within a 12-month period.",
  },
  {
    n: 5,
    title: "Donations exceeding $20,000 and Donations exceeding $30,000 (table headings)",
    publisher: "Electoral Commission",
    url: P20,
    accessed: ACCESSED,
    quote:
      "Party donations exceeding $20,000 since 1 January 2026 · Party donations exceeding $20,000 since 1 January 2023 · Party donations exceeding $30,000 from 1 January 2011 to 31 December 2022 (years 2022 to 2011) · Party donations exceeding $20,000 from 2008 to 2010",
  },
  {
    n: 6,
    title: "Electoral Act 1993, section 3 (public inspection period)",
    publisher: "New Zealand Legislation (Parliamentary Counsel Office)",
    url: "https://www.legislation.govt.nz/act/public/1993/0087/latest/DLM1712301.html",
    accessed: ACCESSED,
    quote:
      "public inspection period means, in relation to a return filed under any of sections 205K, 206I, 206ZC, 209, 210, 210C, 214C, and 214F, the period (a) commencing as soon as is reasonably practicable after the Electoral Commission receives the completed return; and (b) ending 6 years later",
  },
];
