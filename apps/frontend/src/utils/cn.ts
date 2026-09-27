type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean | undefined } | ClassValue[];

// Lightweight cn helper (combine tailwind classes — no clsx dependency needed)
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flatMap((i) => {
      if (!i) return [];
      if (typeof i === 'string') return [i];
      if (Array.isArray(i)) return i.filter(Boolean);
      if (typeof i === 'object') {
        return Object.entries(i)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k);
      }
      return [];
    })
    .join(' ');
}

// Format currency (INR)
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// Format date
export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

// Format date-time
export const formatDateTime = (date: string | Date): string =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));

// Get initials
export const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// Status badge color
export const statusColor = (status: string) => {
  const map: Record<string, string> = {
    PAID: 'badge-success', PARTIAL: 'badge-warning', DUE: 'badge-error',
    ACTIVE: 'badge-success', EXPIRED: 'badge-error', CANCELLED: 'badge-gray',
    SCHEDULED: 'badge-info', CONFIRMED: 'badge-success',
    IN_PROGRESS: 'badge-warning', COMPLETED: 'badge-success',
    NO_SHOW: 'badge-error', DRAFT: 'badge-gray',
  };
  return map[status] || 'badge-gray';
};
