export function formatNzd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const formatted = Math.abs(amount).toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
}

export function formatCompactNzd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const digits = millions >= 10 ? 1 : 2;
    const formatted = millions.toLocaleString("en-NZ", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    return `${sign}$${formatted}m`;
  }
  if (abs >= 10_000) {
    const thousands = Math.round(abs / 1000);
    return `${sign}$${thousands.toLocaleString("en-NZ")}k`;
  }
  return formatNzd(amount);
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-NZ");
}

export function formatShare(share: number): string {
  if (share > 0 && share < 0.005) return "<1%";
  return `${Math.round(share * 100)}%`;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
