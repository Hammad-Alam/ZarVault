// Format PKR amount for display
export function formatPKR(amount: number): string {
  return `₨${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format gold grams for display
export function formatGold(grams: number): string {
  return `${grams.toFixed(4)}g`;
}

// Round to gold precision (4 decimals)
export function roundGold(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// Round to PKR precision (2 decimals)
export function roundPKR(value: number): number {
  return Math.round(value * 100) / 100;
}
