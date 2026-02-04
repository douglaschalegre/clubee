export const RESERVED_RSVP_STATUSES = [
  "going",
  "pending_payment",
  "approved_pending_payment",
  "pending_approval",
] as const;

export type ReservedRsvpStatus = (typeof RESERVED_RSVP_STATUSES)[number];

export function isReservedStatus(
  status: string | null | undefined
): status is ReservedRsvpStatus {
  if (!status) return false;
  return (RESERVED_RSVP_STATUSES as readonly string[]).includes(status);
}
