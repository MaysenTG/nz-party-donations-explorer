import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { DATA_UPDATED } from "./src/lib/source.ts";

const VIRTUAL_DONATIONS = "virtual:donations";
const RESOLVED_VIRTUAL_DONATIONS = "\0virtual:donations";

type RawRow = Record<string, unknown>;

function readDonationRows(): RawRow[] {
  const file = path.resolve("src/data/donations.json");
  const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("donations.json must be an array");
  }
  return parsed.filter(
    (row): row is RawRow => typeof row === "object" && row !== null && !Array.isArray(row),
  );
}

/** Drop any donor_address field; keep filed donor names for the optional privacy setting. */
function forPublicBundle(rows: RawRow[]): RawRow[] {
  return rows.map((row) => {
    const copy = { ...row };
    delete copy.donor_address;
    delete copy.name_withheld;
    return copy;
  });
}

/**
 * Serves donation rows to the app.
 * - Drops any donor_address field (the committed file no longer has one; this stays as a guard).
 * - Keeps donor names as filed so the in-app privacy toggle can hide older names.
 */
function publicDonations(): Plugin {
  return {
    name: "public-donations",
    resolveId(id) {
      if (id === VIRTUAL_DONATIONS) return RESOLVED_VIRTUAL_DONATIONS;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_DONATIONS) return null;
      const file = path.resolve("src/data/donations.json");
      this.addWatchFile(file);
      const rows = forPublicBundle(readDonationRows());
      return `export default ${JSON.stringify(rows)}`;
    },
  };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

/** Writes a public CSV and fills the no-JS SEO shell with totals. */
function seoShellAndCsv(): Plugin {
  return {
    name: "seo-shell-and-csv",
    transformIndexHtml(html) {
      const rows = forPublicBundle(readDonationRows());
      let totalCents = 0;
      let counted = 0;
      const parties = new Set<string>();
      const donors = new Set<string>();
      for (const r of rows) {
        if (r.returned_to_donor === true) continue;
        counted += 1;
        parties.add(String(r.party ?? ""));
        const name = String(r.donor_name ?? "");
        if (name) donors.add(name);
        if (r.party_to_party === true) continue;
        totalCents += Math.round(Number(r.amount) * 100);
      }
      const total = totalCents / 100;
      const totalLabel =
        total >= 1_000_000
          ? `$${(Math.round((total / 1_000_000) * 100) / 100).toLocaleString("en-NZ", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}m`
          : `$${Math.round(total).toLocaleString("en-NZ")}`;
      const nz = (n: number) => n.toLocaleString("en-NZ");
      return html
        .replace(
          /<span data-seo-count>[\s\S]*?<\/span>/,
          `<span data-seo-count>${nz(counted)} returns · Last updated: ${DATA_UPDATED}</span>`,
        )
        .replace(
          /<section class="stat-cards" aria-label="Summary" data-seo-stats>[\s\S]*?<\/section>/,
          `<section class="stat-cards" aria-label="Summary" data-seo-stats>
          <div class="stat-card">
            <p class="stat-label">Total declared</p>
            <p class="stat-value">${totalLabel}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Returns</p>
            <p class="stat-value">${nz(counted)}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Donor names</p>
            <p class="stat-value">${nz(donors.size)}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Parties</p>
            <p class="stat-value">${nz(parties.size)}</p>
          </div>
        </section>`,
        );
    },
    closeBundle() {
      const rows = forPublicBundle(readDonationRows());
      const header = [
        "party",
        "donor_name",
        "amount",
        "latest_donation_date_in_return",
        "return_received_date",
        "amended_return_received_date",
        "returned_to_donor",
        "donor_is_party",
        "notes",
        "source_pdf_url",
      ];
      const lines = [
        header.join(","),
        ...rows.map((row) =>
          [
            String(row.party ?? ""),
            String(row.donor_name ?? ""),
            String(row.amount ?? ""),
            String(row.donation_received_date ?? ""),
            String(row.return_received_date ?? ""),
            String(row.amended_return_received_date ?? ""),
            row.returned_to_donor === true ? "yes" : "",
            row.party_to_party === true ? "yes" : "",
            Array.isArray(row.notes) ? row.notes.join(" ") : "",
            String(row.source_pdf_url ?? ""),
          ]
            .map((cell) => csvEscape(cell))
            .join(","),
        ),
      ];
      const outDir = path.resolve("dist");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "donations.csv"), `${lines.join("\n")}\n`);
    },
  };
}

export default defineConfig({
  plugins: [publicDonations(), seoShellAndCsv(), react()],
});
