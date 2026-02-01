import { z } from "zod/v4";

export const createClubSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.url("Invalid image URL").optional(),
});

export const updateClubSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.url("Invalid image URL").optional(),
});

export const updateMembershipStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type UpdateMembershipStatusInput = z.infer<typeof updateMembershipStatusSchema>;
