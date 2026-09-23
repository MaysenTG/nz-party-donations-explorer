/**
 * Colours from Wikipedia’s NZ party meta attributes index
 * (https://en.wikipedia.org/wiki/Wikipedia:Index_of_New_Zealand_political_party_meta_attributes).
 */
const FAMILY_COLOURS: Record<string, string> = {
  act: "#FDE401",
  advance: "#1987D1",
  conservative: "#00AEEF",
  family: "#FFEB33",
  green: "#098137",
  internet: "#662C92",
  labour: "#D82A20",
  maori: "#B2001A",
  national: "#00529F",
  nzfirst: "#000000",
  one: "#F9D11A",
  peoples: "#5BCAF4",
  sustainable: "#008080",
  top: "#09B598",
};

const FALLBACK_COLOUR = "#5c645e";

export type PartyFamily = keyof typeof FAMILY_COLOURS;

export function partyFamily(party: string): PartyFamily | null {
  const name = party.toLowerCase();
  if (name.includes("internet")) return "internet";
  if (name.includes("national")) return "national";
  if (name.includes("labour")) return "labour";
  if (name.includes("green") || name.includes("greens")) return "green";
  if (/\bact\b/.test(name) || name.includes("the act party")) return "act";
  if (name.includes("first")) return "nzfirst";
  if (
    name.includes("māori") ||
    name.includes("maori") ||
    name.includes("pāti māori") ||
    name.includes("pati maori")
  ) {
    return "maori";
  }
  if (name.includes("opportunit")) return "top";
  if (name.includes("advance")) return "advance";
  if (name.includes("conservative")) return "conservative";
  if (name.includes("sustainable")) return "sustainable";
  if (name.includes("one party") || name === "one party") return "one";
  if (name.includes("family")) return "family";
  if (name.includes("people")) return "peoples";
  return null;
}

export function partyColour(party: string): string {
  const family = partyFamily(party);
  return family ? FAMILY_COLOURS[family] : FALLBACK_COLOUR;
}

/** Dark text on light brand colours (ACT yellow, etc.). */
export function partyColourNeedsDarkInk(colour: string): boolean {
  const hex = colour.replace("#", "");
  if (hex.length !== 6) return false;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65;
}

export function partyColourInk(colour: string): string {
  return partyColourNeedsDarkInk(colour) ? "#1c211e" : "#ffffff";
}

export function darkenColour(hex: string, amount = 0.22): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const channel = (start: number) => {
    const value = Number.parseInt(raw.slice(start, start + 2), 16);
    return Math.max(0, Math.round(value * (1 - amount)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

export function shortPartyLabel(party: string): string {
  const family = partyFamily(party);
  switch (family) {
    case "national":
      return "National";
    case "labour":
      return "Labour";
    case "green":
      return "Greens";
    case "act":
      return "ACT";
    case "nzfirst":
      return "NZ First";
    case "maori":
      return "Te Pāti Māori";
    case "top":
      return "TOP";
    case "advance":
      return "Advance NZ";
    case "conservative":
      return "Conservatives";
    default:
      return party;
  }
}
