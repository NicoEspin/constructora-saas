export function formatCurrency(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return String(value);
  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });
}

export function formatDate(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? '—';
}

export function formatDelayHours(totalHours: number): string {
  if (totalHours === 0) return '0 h';
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days === 0) return `${hours} h`;
  if (hours === 0) return `${days} d`;
  return `${days} d ${hours} h`;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function isNegative(value: string | null | undefined): boolean {
  if (!value) return false;
  return Number(value) < 0;
}
