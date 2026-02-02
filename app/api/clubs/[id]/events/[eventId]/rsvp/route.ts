import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { rsvpSchema } from "@/lib/validations/event";
import { jsonError, jsonSuccess } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id: clubId, eventId } = await context.params;
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    return jsonError("Não autorizado", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });

  if (!dbUser) {
    return jsonError("Não autorizado", 401);
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: dbUser.id, clubId } },
  });

  if (!membership || membership.status !== "active") {
    return jsonError("Assinatura ativa obrigatória", 403);
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: { id: true },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const validation = rsvpSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const { status } = validation.data;

  try {
    const rsvp = await prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId: dbUser.id } },
      create: { eventId, userId: dbUser.id, status },
      update: { status },
    });

    return jsonSuccess({ rsvp });
  } catch (error) {
    console.error("Falha ao atualizar RSVP:", error);
    return jsonError("Falha ao atualizar RSVP", 500);
  }
}
