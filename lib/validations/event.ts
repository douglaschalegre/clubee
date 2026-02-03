import { z } from "zod/v4";

const baseEventSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(120, "Título muito longo"),
  description: z.string().max(2000, "Descrição muito longa").optional(),
  startsAt: z.string().min(1, "Data de início obrigatória"),
  timezone: z.string().min(1, "Fuso horário obrigatório"),
  locationType: z.enum(["remote", "physical"]),
  locationValue: z.string().min(1, "Localização obrigatória"),
  locationPlaceId: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
});

export const createEventSchema = baseEventSchema;

export const updateEventSchema = baseEventSchema.partial();

export const rsvpSchema = z.object({
  status: z.enum(["going", "not_going"], { message: "Status inválido" }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
