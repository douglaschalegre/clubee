import { z } from "zod/v4";

const baseEventSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(120, "Título muito longo"),
  description: z.string().max(2000, "Descrição muito longa").optional(),
  startsAt: z.string().min(1, "Data de início obrigatória"),
  timezone: z.string().min(1, "Fuso horário obrigatório"),
  locationType: z.enum(["remote", "physical"]),
  locationValue: z.string().min(1, "Localização obrigatória"),
  price: z
    .number()
    .min(0)
    .nullable()
    .optional()
    .refine(
      (val) => val === undefined || val === null || val === 0 || val >= 1,
      "Preço mínimo é R$ 1,00 ou gratuito"
    ),
  requiresApproval: z.boolean().optional(),
});

export const createEventSchema = baseEventSchema;

export const updateEventSchema = baseEventSchema.partial();

export const rsvpSchema = z.object({
  status: z.enum(
    [
      "going",
      "not_going",
      "pending_payment",
      "pending_approval",
      "approved_pending_payment",
      "rejected",
      "payment_failed",
    ],
    { message: "Status inválido" }
  ),
});

export const eventPricingSchema = z.object({
  priceCents: z
    .number()
    .int()
    .min(0)
    .nullable()
    .refine(
      (val) => val === null || val === 0 || val >= 100,
      "Preço mínimo é R$ 1,00 (100 centavos) ou gratuito"
    ),
});

export const eventApprovalSchema = z.object({
  requiresApproval: z.boolean().default(false),
});

export const approvalActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
export type EventPricingInput = z.infer<typeof eventPricingSchema>;
export type EventApprovalInput = z.infer<typeof eventApprovalSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
