import { z } from "zod/v4";

export const createClubSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  imageUrl: z.url("URL de imagem inválida").optional(),
  membershipPrice: z
    .number()
    .min(0)
    .nullable()
    .optional()
    .refine(
      (val) => val === undefined || val === null || val === 0 || val >= 1,
      "Preço mínimo é R$ 1,00 ou gratuito"
    ),
});

export const updateClubSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Nome muito longo").optional(),
  description: z.string().max(500, "Descrição muito longa").optional(),
  imageUrl: z.url("URL de imagem inválida").optional(),
});

export const updateMembershipStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type UpdateMembershipStatusInput = z.infer<typeof updateMembershipStatusSchema>;
