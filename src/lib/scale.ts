/** Axis ceiling a little above the largest value, without jumping to ~2×. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const padded = value * 1.05;
  const power = 10 ** Math.floor(Math.log10(padded));
  const scaled = padded / power;
  const steps = [1, 1.1, 1.2, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10];
  const nice = steps.find((step) => scaled <= step) ?? 10;
  return nice * power;
}

export function axisTicks(max: number, count = 4): { top: number; ticks: number[] } {
  const top = niceMax(max);
  const ticks = Array.from({ length: count + 1 }, (_, index) => (top * index) / count);
  return { top, ticks };
}
