import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { nzDateToIso } from "./src/lib/dates.ts";
import { classifyDonor } from "./src/lib/donors.ts";
import {
  OLD_INDIVIDUAL_LABEL,
  inspectionCutoffIso,
  isPastInspection,
  withholdName,
} from "./src/lib/privacy.ts";

const VIRTUAL_DONATIONS = "virtual:donations";
const RESOLVED_VIRTUAL_DONATIONS = "\0virtual:donations";

/**
 * Serves donation rows to the app.
 * - Drops any donor_address field (the committed file no longer has one; this stays as a guard).
 * - Withholds individual donors' names (and organisation names that name a person) on returns past the 6 year inspection period,
 *   using the build date, so those names are not shipped in the bundle.
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
      const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!Array.isArray(parsed)) {
        throw new Error("donations.json must be an array");
      }
      const cutoff = inspectionCutoffIso(new Date());
      const rows = parsed.map((row) => {
        if (typeof row !== "object" || row === null || Array.isArray(row)) return row;
        const copy = { ...(row as Record<string, unknown>) };
        delete copy.donor_address;
        const name = String(copy.donor_name ?? "");
        const returned = String(copy.return_received_date ?? "");
        if (
          withholdName(classifyDonor(name) === "individual", name) &&
          isPastInspection(nzDateToIso(returned), cutoff)
        ) {
          copy.donor_name = OLD_INDIVIDUAL_LABEL;
          copy.name_withheld = true;
        }
        return copy;
      });
      return `export default ${JSON.stringify(rows)}`;
    },
  };
}

/** Fills the no-JS SEO shell with live totals so crawlers see real numbers. */
function seoShellStats(): Plugin {
  return {
    name: "seo-shell-stats",
    transformIndexHtml(html) {
      const file = path.resolve("src/data/donations.json");
      const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!Array.isArray(parsed)) return html;
      let totalCents = 0;
      let counted = 0;
      const parties = new Set<string>();
      const donors = new Set<string>();
      for (const row of parsed) {
        if (typeof row !== "object" || row === null || Array.isArray(row)) continue;
        const r = row as Record<string, unknown>;
        if (r.returned_to_donor === true) continue;
        counted += 1;
        parties.add(String(r.party ?? ""));
        const name = String(r.donor_name ?? "");
        if (name && r.name_withheld !== true) donors.add(name);
        if (r.party_to_party === true) continue;
        totalCents += Math.round(Number(r.amount) * 100);
      }
      const total = totalCents / 100;
      const totalLabel =
        total >= 1_000_000
          ? `$${(total / 1_000_000).toLocaleString("en-NZ", { maximumFractionDigits: 1 })}m`
          : `$${Math.round(total).toLocaleString("en-NZ")}`;
      const nz = (n: number) => n.toLocaleString("en-NZ");
      return html
        .replace(
          /<span data-seo-count>[\s\S]*?<\/span>/,
          `<span data-seo-count>${nz(counted)} returns in totals (${nz(parsed.length)} filed) · Electoral Commission data</span>`,
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
  };
}

export default defineConfig({
  plugins: [publicDonations(), seoShellStats(), react()],
});
