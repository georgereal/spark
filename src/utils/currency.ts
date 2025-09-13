/**
 * Format currency amount as INR
 * @param amount - The amount to format
 * @returns Formatted currency string with ₹ symbol
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format currency amount as INR with decimal places
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string with ₹ symbol and specified decimal places
 */
export const formatCurrencyWithDecimals = (amount: number, decimals: number = 0): string => {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`;
};
