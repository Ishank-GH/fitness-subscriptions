/**
 * Adds months to a UTC date, clamping to the last day of the target
 * month when the source day overshoots.
 *
 * Jan 31 + 1 month → Feb 28 (or Feb 29 in a leap year), not Mar 3.
 */
export function addMonths(startDate: Date, months: number): Date {
  const year = startDate.getUTCFullYear();
  const month = startDate.getUTCMonth() + months;
  const day = startDate.getUTCDate();

  // Day 0 of the next month gives the last day of the target month
  const lastDayOfTarget = new Date(
    Date.UTC(year, month + 1, 0)
  ).getUTCDate();

  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(day, lastDayOfTarget),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
      startDate.getUTCSeconds(),
      startDate.getUTCMilliseconds()
    )
  );
}
