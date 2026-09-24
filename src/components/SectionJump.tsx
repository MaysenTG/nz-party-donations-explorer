const SECTIONS = [
  { id: "year-filter", label: "Years" },
  { id: "summary", label: "Totals" },
  { id: "party-chart-title", label: "Parties" },
  { id: "donor-chart-title", label: "Donors" },
  { id: "table-title", label: "Donations" },
  { id: "time-title", label: "Over time" },
  { id: "election-cycles-title", label: "Elections" },
  { id: "about", label: "About" },
] as const;

export function SectionJump() {
  return (
    <nav className="section-jump" aria-label="On this page">
      <p className="section-jump-label">Jump to</p>
      <ul>
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`}>{section.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
