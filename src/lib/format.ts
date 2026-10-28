/**
 * Converts integer paise into formatted INR currency string (e.g. 450000 -> "₹4,500").
 */
export function formatPaiseToRupees(paise: number): string {
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/**
 * Converts integer paise to numerical rupee amount (e.g. 450000 -> 4500).
 */
export function paiseToRupees(paise: number): number {
  return Math.round(paise / 100);
}

/**
 * Converts numerical rupee amount into integer paise (e.g. 4500 -> 450000).
 * Uses Math.round to avoid any floating-point inaccuracy.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Formats a Date into standard readable string (e.g. "28 Oct 2026").
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a Date into readable timestamp (e.g. "28 Oct 2026, 05:30 PM").
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
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

