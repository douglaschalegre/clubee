import { z } from "zod/v4";

export const createClubSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  imageUrl: z.url("URL de imagem inválida").optional(),
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
