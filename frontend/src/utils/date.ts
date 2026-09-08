/**
 * Date utility functions for standardized UTC parsing and relative time formatting.
 */

/**
 * Parses a date string safely, ensuring UTC timestamps without timezone markers
 * (e.g. "2026-08-26T11:04:04.570343" or "2026-08-26 11:04:04") are interpreted as UTC
 * rather than the user's local timezone.
 */
export function parseDate(dateInput: string | number | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  if (typeof dateInput === "number") return new Date(dateInput);

  let s = String(dateInput).trim();
  if (!s) return new Date();

  // If it's a date-only string like "YYYY-MM-DD", let Date parse it or handle as needed
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // If it does not contain a timezone specifier ('Z', '+HH:MM', or '-HH:MM' at the end)
  if (!s.endsWith("Z") && !/[+-]\d{2}(?::?\d{2})?$/.test(s)) {
    // Replace space between date & time with T and append Z for UTC
    s = s.replace(" ", "T") + "Z";
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date(dateInput) : parsed;
}

/**
 * Formats a date string into a human-friendly relative time (e.g., "Just now", "5m ago", "2h ago", "Yesterday", "3d ago").
 */
export function formatTimeAgo(dateInput: string | number | Date | null | undefined): string {
  try {
    if (!dateInput) return "Just now";
    const date = parseDate(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Less than 1 minute (or negative due to minor clock differences)
    if (diffMs < 60000) {
      return "Just now";
    }

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    if (days === 1) {
      return "Yesterday";
    }
    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return "Just now";
  }
}

/**
 * Formats a date to 12-hour/24-hour localized time string (e.g., "04:30 PM").
 */
export function formatTime(
  dateInput: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    if (!dateInput) return "";
    const date = parseDate(dateInput);
    return date.toLocaleTimeString([], options || { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a date to a localized date string (e.g., "Aug 26, 2026").
 */
export function formatDate(
  dateInput: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    if (!dateInput) return "";
    const date = parseDate(dateInput);
    return date.toLocaleDateString(
      undefined,
      options || { month: "short", day: "numeric", year: "numeric" }
    );
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date for message chat dividers (Today, Yesterday, or formatted date).
 */
export function formatDateDivider(dateInput: string | number | Date | null | undefined): string {
  try {
    if (!dateInput) return "";
    const date = parseDate(dateInput);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    return String(dateInput);
  }
}
