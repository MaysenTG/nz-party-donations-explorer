/** Round axis step so labels stay simple ($3m, $5m) without jumping to ~1.5×. */
function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(rough));
  const scaled = rough / power;
  const nice =
    scaled <= 1
      ? 1
      : scaled <= 1.25
        ? 1.25
        : scaled <= 1.5
          ? 1.5
          : scaled <= 2
            ? 2
            : scaled <= 2.5
              ? 2.5
              : scaled <= 3
                ? 3
                : scaled <= 4
                  ? 4
                  : scaled <= 5
                    ? 5
                    : 10;
  return nice * power;
}

/** Axis ceiling a little above the largest value, on a clean step. */
export function niceMax(value: number, tickCount = 4): number {
  if (value <= 0) return 1;
  const step = niceStep((value * 1.04) / tickCount);
  return step * Math.ceil((value * 1.02) / step);
}

export function axisTicks(max: number, count = 4): { top: number; ticks: number[] } {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const step = niceStep((max * 1.04) / count);
  const top = step * Math.ceil((max * 1.02) / step);
  const ticks: number[] = [];
  for (let value = 0; value <= top + step * 1e-9; value += step) {
    ticks.push(value);
  }
  return { top, ticks };
}
