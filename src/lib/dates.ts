const MONTH_INDEX: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function nzDateToIso(value: string): string {
  const match = value.trim().match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  if (!match) {
    throw new Error(`Unrecognised date: ${value}`);
  }
  const day = Number(match[1]);
  const month = MONTH_INDEX[match[2]];
  const year = Number(match[3]);
  if (!month || day < 1 || day > 31) {
    throw new Error(`Unrecognised date: ${value}`);
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatIsoLong(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function nextMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabels(key: string): { short: string; full: string } {
  const [year, month] = key.split("-").map(Number);
  return {
    short: SHORT_MONTHS[month - 1] ?? key,
    full: `${LONG_MONTHS[month - 1] ?? key} ${year}`,
  };
}
