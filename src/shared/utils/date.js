import { format, parseISO, isValid } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format date to standard Indonesian format (dd MMM yyyy)
 * @param {string|Date} dateString
 * @param {string} formatStr Optional custom date-fns format string
 */
export function formatDate(dateString, formatStr = "dd MMM yyyy") {
  if (!dateString) return "-";
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;
  if (!isValid(date)) return "-";
  return format(date, formatStr, { locale: id });
}

/**
 * Format date and time (dd MMM yyyy, HH:mm)
 */
export function formatDateTime(dateString) {
  return formatDate(dateString, "dd MMM yyyy, HH:mm");
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(dateString) {
  return formatDate(dateString, "HH:mm");
}
