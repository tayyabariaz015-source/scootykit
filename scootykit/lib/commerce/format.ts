const pkr = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Formats a PKR amount as "Rs. 1,250". */
export function formatPKR(amount: number): string {
  const rounded = Math.round(amount);
  return `Rs. ${pkr.format(rounded)}`;
}
