export function formatCurrency(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '0.00';
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default { formatCurrency };
