import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

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

export function getRsvpStatusBadge(
  status: RsvpStatus
): { label: string; variant: BadgeVariant } | null {
  switch (status) {
    case "pending_approval":
      return { label: "Aguardando aprovação", variant: "secondary" };
    case "pending_payment":
      return { label: "Pagamento pendente", variant: "secondary" };
    case "approved_pending_payment":
      return { label: "Aprovado", variant: "secondary" };
    case "going":
      return { label: "Confirmado", variant: "outline" };
    case "rejected":
      return { label: "Solicitação negada", variant: "destructive" };
    case "payment_failed":
      return { label: "Pagamento falhou", variant: "destructive" };
    default:
      return null;
  }
}
