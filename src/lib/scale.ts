export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const padded = value * 1.08;
  const power = 10 ** Math.floor(Math.log10(padded));
  const scaled = padded / power;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return nice * power;
}

export function axisTicks(max: number, count = 4): { top: number; ticks: number[] } {
  const top = niceMax(max);
  const ticks = Array.from({ length: count + 1 }, (_, index) => (top * index) / count);
  return { top, ticks };
}
