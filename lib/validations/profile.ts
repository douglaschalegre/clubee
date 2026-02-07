import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome obrigatório")
    .max(80, "Nome muito longo")
    .refine((value) => !value.includes("@"), {
      message: "O nome não pode conter @",
    }),
});
