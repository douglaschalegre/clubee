import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { profileSchema } from "@/lib/validations/profile";

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const validation = profileSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const normalizedPhone = validation.data.phone?.trim() ?? "";
  const phone = normalizedPhone.length > 0 ? normalizedPhone : null;

  const updated = await prisma.user.update({
    where: { id: authResult.user.id },
    data: {
      name: validation.data.name,
      phone,
      profileCompleted: true,
    },
  });

  return jsonSuccess({ user: updated });
}
