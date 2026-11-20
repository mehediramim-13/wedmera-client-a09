import { format, isValid, parseISO } from "date-fns";

const bdtFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

/** Formats a BDT amount as "৳ 25,000". */
export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "৳ 0";
  }
  return `৳ ${bdtFormatter.format(Number(amount))}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "MMM d, yyyy, h:mm a");
}

export function formatDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function initials(name: string | null | undefined): string {
  if (!name) return "W";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
