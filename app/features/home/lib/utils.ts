/**
 * Format number with k suffix for thousands
 * Examples: 3700 → "3.7k", 17000 → "17k", 100 → "100"
 */
export function formatNumber(num: number): string {
  if (num >= 1000) {
    const k = num / 1000;
    // If it's a whole number, show without decimal
    if (k % 1 === 0) {
      return `${k}k`;
    }
    // Otherwise, show one decimal place
    return `${k.toFixed(1)}k`;
  }
  return num.toString();
}


