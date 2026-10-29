/**
 * Converts integer paise into formatted INR currency string.
 * Displays exact decimal paise (e.g. 540050 -> "₹5,400.50") and drops decimals only when whole (e.g. 540000 -> "₹5,400").
 */
export function formatPaiseToRupees(paise: number): string {
  const rupees = paise / 100;
  const hasDecimals = paise % 100 !== 0;

  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Converts integer paise to numerical rupee amount without rounding loss.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Converts numerical rupee amount into integer paise.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Formats a Date into standard readable string using Asia/Kolkata time zone.
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a Date into readable timestamp using Asia/Kolkata time zone.
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats duration in months into clean readable text ("1 month", "3 months").
 */
export function formatDurationMonths(months: number): string {
  return `${months} ${months === 1 ? "month" : "months"}`;
}
