import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { updateEventSchema } from "@/lib/validations/event";
import { jsonError, jsonSuccess } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

function validateLocation(data: {
  locationType?: "remote" | "physical";
  locationPlaceId?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
}) {
  if (data.locationType === "physical") {
    if (!data.locationPlaceId || data.locationLat == null || data.locationLng == null) {
      return "Localização física inválida";
    }
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: clubId, eventId } = await context.params;
  const session = await auth0.getSession();

  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  if (!session?.user?.sub) {
    return jsonSuccess({
      event: {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timezone: event.timezone,
      },
      canViewDetails: false,
    });
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

  const isMember = membership?.status === "active";

  if (!isMember) {
    return jsonSuccess({
      event: {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timezone: event.timezone,
      },
      canViewDetails: false,
    });
  }

  return jsonSuccess({ event, canViewDetails: true });
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { organizerId: true },
  });

  if (!club) {
    return jsonError("Clube não encontrado", 404);
  }

  if (club.organizerId !== dbUser.id) {
    return jsonError("Acesso de organizador obrigatório", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const validation = updateEventSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const data = validation.data;
  const locationError = validateLocation(data);
  if (locationError) {
    return jsonError(locationError, 400);
  }

  try {
    const event = await prisma.event.update({
      where: { id: eventId, clubId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startsAt !== undefined && { startsAt: new Date(data.startsAt) }),
        ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.locationType !== undefined && { locationType: data.locationType }),
        ...(data.locationValue !== undefined && { locationValue: data.locationValue }),
        ...(data.locationPlaceId !== undefined && { locationPlaceId: data.locationPlaceId }),
        ...(data.locationLat !== undefined && { locationLat: data.locationLat }),
        ...(data.locationLng !== undefined && { locationLng: data.locationLng }),
      },
    });

    return jsonSuccess({ event });
  } catch (error) {
    console.error("Falha ao atualizar evento:", error);
    return jsonError("Falha ao atualizar evento", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { organizerId: true },
  });

  if (!club) {
    return jsonError("Clube não encontrado", 404);
  }

  if (club.organizerId !== dbUser.id) {
    return jsonError("Acesso de organizador obrigatório", 403);
  }

  try {
    await prisma.event.delete({
      where: { id: eventId, clubId },
    });
    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error("Falha ao excluir evento:", error);
    return jsonError("Falha ao excluir evento", 500);
  }
}
