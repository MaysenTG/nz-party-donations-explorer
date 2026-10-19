/** Shared Recharts tooltip chrome so hover panels match across charts. */
export const CHART_TOOLTIP_STYLE = {
  border: "1px solid #ddd6c8",
  borderRadius: 10,
  background: "#fbfaf6",
  fontSize: 14,
} as const;

export const CHART_TOOLTIP_STYLE_NARROW = {
  ...CHART_TOOLTIP_STYLE,
  fontSize: 15,
} as const;
