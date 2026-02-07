import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
} from "lucide-react";

export type RsvpStatus =
  | "going"
  | "not_going"
  | "pending_payment"
  | "pending_approval"
  | "approved_pending_payment"
  | "rejected"
  | "payment_failed"
  | null;

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

type StatusBadge = {
  label: string;
  variant: BadgeVariant;
  className: string;
  icon: LucideIcon;
};

const baseBadgeClass =
  "gap-1.5 px-2.5 py-1 font-semibold tracking-[0.01em] shadow-[0_1px_0_rgba(0,0,0,0.08)] ring-1 ring-inset ring-white/40 dark:ring-white/10";

const badgeTones = {
  approval:
    "border-slate-200/80 bg-slate-50/90 text-slate-700 dark:border-slate-500/30 dark:bg-slate-900/40 dark:text-slate-200",
  payment:
    "border-amber-200/80 bg-amber-50/90 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200",
  success:
    "border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200",
  rejected:
    "border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200",
  failed:
    "border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200",
};

export function getRsvpStatusBadge(
  status: RsvpStatus
): StatusBadge | null {
  switch (status) {
    case "pending_approval":
      return {
        label: "Aguardando aprovação",
        variant: "outline",
        className: `${baseBadgeClass} ${badgeTones.approval}`,
        icon: Clock,
      };
    case "pending_payment":
      return {
        label: "Pagamento pendente",
        variant: "outline",
        className: `${baseBadgeClass} ${badgeTones.payment}`,
        icon: CreditCard,
      };
    case "approved_pending_payment":
      return {
        label: "Pagamento pendente",
        variant: "outline",
        className: `${baseBadgeClass} ${badgeTones.payment}`,
        icon: CreditCard,
      };
    case "going":
      return {
        label: "Inscrição confirmada",
        variant: "outline",
        className: `${baseBadgeClass} ${badgeTones.success}`,
        icon: CheckCircle2,
      };
    case "rejected":
      return {
        label: "Solicitação negada",
        variant: "outline",
        className: `${baseBadgeClass} ${badgeTones.rejected}`,
        icon: XCircle,
      };
    case "payment_failed":
      return {
        label: "Pagamento falhou",
        variant: "outline",
        className: `${baseBadgeClass} ${badgeTones.failed}`,
        icon: AlertTriangle,
      };
    default:
      return null;
  }
}
