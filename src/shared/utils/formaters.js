import { format } from "date-fns";
import { id } from "date-fns/locale";

// ─── Number Formatters ────────────────────────────────────────────────────────

/**
 * Singleton formatter — reused across renders to avoid recreating Intl objects.
 * @type {Intl.NumberFormat}
 */
const weightFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format weight in tons with 2 decimal places (Indonesian locale).
 * @param {number|null|undefined} weight
 * @returns {string}
 */
export const formatWeight = (weight) => weightFormatter.format(weight ?? 0);

// ─── Date / Time Formatters ───────────────────────────────────────────────────

/**
 * Format an ISO date string to "dd MMM yyyy" (Indonesian locale).
 * Returns '-' for empty/invalid input.
 * @param {string|null|undefined} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd MMM yyyy", { locale: id });
  } catch {
    return dateString;
  }
};

/**
 * Slice the first 5 characters from a time string "HH:mm:ss" → "HH:mm".
 * Returns '-' for empty input.
 * @param {string|null|undefined} timeString
 * @returns {string}
 */
export const formatTime = (timeString) => {
  if (!timeString) return "-";
  return timeString.substring(0, 5);
};

/**
 * Format a full datetime string to locale time "HH:mm" (24-hour, Indonesian).
 * Returns '-' for empty/invalid input.
 * @param {string|null|undefined} dateTimeString
 * @returns {string}
 */
export const finishedTime = (dateTimeString) => {
  if (!dateTimeString) return "-";
  return new Date(dateTimeString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * Format a duration in minutes to a human-readable string ("Xj Ym").
 * Returns '-' for null/NaN input.
 * @param {number|null|undefined} minutes
 * @returns {string}
 */
export const formatDurasi = (minutes) => {
  if (minutes == null || isNaN(minutes)) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h}j`;
  return `${m}m`;
};

// ─── Badge Color Helpers ──────────────────────────────────────────────────────

/**
 * Tailwind class string for a shift badge.
 * @param {string|null|undefined} shift
 * @returns {string}
 */
export const getShiftBadgeColor = (shift) => {
  if (shift?.includes("LS 1")) return "bg-yellow-100 text-yellow-800";
  if (shift?.includes("LS 2")) return "bg-purple-100 text-purple-800";
  if (shift?.includes("Shift 1")) return "bg-blue-100 text-blue-800";
  if (shift?.includes("Shift 2")) return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

/**
 * Tailwind class string for a coal type badge.
 * @param {string|null|undefined} coalType
 * @returns {string}
 */
export const getCoalTypeBadgeColor = (coalType) => {
  switch (coalType?.toLowerCase()) {
    case "crushed":
      return "bg-blue-100 text-blue-800";
    case "uncrushed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Tailwind class string for a finish-status badge.
 * @param {string|null|undefined} finishStatus
 * @returns {string}
 */
export const getFinishStatus = (finishStatus) => {
  switch (finishStatus?.toLowerCase()) {
    case "finish":
      return "bg-green-100 text-green-800";
    case "in_transit":
      return "bg-yellow-100 text-yellow-800";
    case "out_iup":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// ─── Indonesian Locale Date/Time Formatters ───────────────────────────────────
// Used primarily in table displays and Excel exports.

/** Format a Date/ISO string to "DD/MM/YYYY" (Indonesian locale). */
export const formatTanggal = (dateString) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Format a Date/ISO string to "DD/MM/YYYY, HH:mm:ss" (Indonesian locale, 24h). */
export const formatTanggalWaktu = (dateString) =>
  new Date(dateString).toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

/**
 * Slice a time string "HH:mm:ss" → "HH:mm".
 * Returns empty string for empty/null input.
 * @param {string|null|undefined} timeStr
 * @returns {string}
 */
export const formatWaktu = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  return `${hours}:${minutes}`;
};

/**
 * Null-safe date formatter for shift-date columns.
 * Same output as `formatTanggal` but returns empty string for falsy input.
 * @param {string|null|undefined} dateString
 * @returns {string}
 */
export const formatDateShift = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// ─── Stock / Table Formatters ─────────────────────────────────────────────────

/**
 * Format an integer as Indonesian locale number (no decimal places).
 * Use for ritase counts and whole-ton values in stock tables.
 * @param {number|null|undefined} n
 * @returns {string}
 */
export const fmt = (n) => Number(n || 0).toLocaleString("id-ID");

  /**
   * Extract and format the time portion of a shipment's weighed_at or createdAt
   * field as "HH:mm". Handles ISO strings, "HH:mm:ss", and plain date strings.
   *
   * Pass `showRaw = true` to skip parsing and return the raw value as-is.
   *
   * @param {object} ship - shipment record with optional weighed_at / createdAt
   * @param {boolean} [showRaw=false]
   * @returns {string}
   */
export const timeCellValue = (ship, showRaw = false) => {
  const v = ship?.weighed_at || ship?.createdAt || "";
  if (!v) return "-";
  if (showRaw) return v;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) return v.slice(0, 5);
  const t = v.includes("T") ? v.split("T")[1] : v.split(" ")[1] || v;
  if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5);
  const d = new Date(v);
  if (!isNaN(d)) {
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return v;
};
