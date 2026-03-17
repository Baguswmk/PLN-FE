/**
 * Format number to Indonesian locale with thousand separators
 * @param {number|string} value
 * @param {number} decimals
 */
export function formatTonnage(value, decimals = 2) {
  if (value === null || value === undefined) return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format ritase (integer)
 * @param {number|string} value
 */
export function formatRitase(value) {
  if (value === null || value === undefined) return "0";
  const num = parseInt(value, 10);
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("id-ID").format(num);
}
