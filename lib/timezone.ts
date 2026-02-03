/**
 * Convert a naive datetime (no offset) + IANA timezone to a UTC Date.
 *
 * Example: naiveToUTC("2024-03-15", "19:00", "America/Sao_Paulo")
 *   => Date representing 2024-03-15T22:00:00Z  (SP is UTC-3)
 */
export function naiveToUTC(date: string, time: string, timezone: string): Date {
  const naive = `${date}T${time}:00`;

  // Treat the naive string as UTC to get a reference point
  const refUTC = new Date(naive + "Z");

  // Format that UTC instant in the target timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(refUTC);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;

  // Reconstruct what refUTC looks like in the target timezone, as a UTC timestamp
  const wallUTC = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`
  );

  // The offset = refUTC - wallUTC
  // e.g. for SP (UTC-3): 19:00Z formatted in SP = 16:00 → offset = 19:00 - 16:00 = +3h
  const offsetMs = refUTC.getTime() - wallUTC.getTime();

  // Apply offset: naive 19:00 + 3h = 22:00 UTC
  const result = new Date(refUTC.getTime() + offsetMs);

  // Second pass to handle DST edge cases: recalculate offset at the result time
  const parts2 = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(result);

  const get2 = (type: Intl.DateTimeFormatPartTypes) =>
    parts2.find((p) => p.type === type)!.value;

  const wallUTC2 = new Date(
    `${get2("year")}-${get2("month")}-${get2("day")}T${get2("hour")}:${get2("minute")}:${get2("second")}Z`
  );

  const offsetMs2 = result.getTime() - wallUTC2.getTime();

  // If offset changed (DST transition), recalculate
  if (offsetMs !== offsetMs2) {
    return new Date(refUTC.getTime() + offsetMs2);
  }

  return result;
}

/**
 * Convert a naive datetime string "YYYY-MM-DDTHH:mm" + timezone to UTC Date.
 * Convenience wrapper for API routes that receive a combined string.
 */
export function naiveDateTimeToUTC(
  naiveDatetime: string,
  timezone: string
): Date {
  const [date, time] = naiveDatetime.split("T");
  return naiveToUTC(date, time.slice(0, 5), timezone);
}

/**
 * Extract the local date and time components from a UTC Date in a given timezone.
 * Returns { date: "YYYY-MM-DD", time: "HH:mm" }.
 */
export function utcToLocal(
  utcDate: Date,
  timezone: string
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(utcDate);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}
