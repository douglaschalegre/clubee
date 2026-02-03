import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { createEventSchema } from "@/lib/validations/event";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { naiveDateTimeToUTC } from "@/lib/timezone";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;
  const session = await auth0.getSession();

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, organizerId: true },
  });

  if (!club) {
    return jsonError("Clube não encontrado", 404);
  }

  let dbUserId: string | null = null;
  if (session?.user?.sub) {
    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      select: { id: true },
    });
    dbUserId = dbUser?.id ?? null;
  }

  const membership = dbUserId
    ? await prisma.membership.findUnique({
        where: { userId_clubId: { userId: dbUserId, clubId } },
      })
    : null;

  const isMember = !!membership && membership.status === "active";
  const isOrganizer = dbUserId === club.organizerId;

  const events = await prisma.event.findMany({
    where: { clubId },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      timezone: true,
      ...(isMember || isOrganizer
        ? {
            description: true,
            locationType: true,
            locationValue: true,
            _count: { select: { rsvps: true } },
          }
        : {}),
    },
  });

  return jsonSuccess({
    events,
    canViewDetails: isMember || isOrganizer,
    canManage: isOrganizer,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;
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

  const validation = createEventSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const data = validation.data;

  try {
    const event = await prisma.event.create({
      data: {
        clubId,
        title: data.title,
        description: data.description,
        startsAt: naiveDateTimeToUTC(data.startsAt, data.timezone),
        timezone: data.timezone,
        locationType: data.locationType,
        locationValue: data.locationValue,
        createdById: dbUser.id,
      },
    });

    return jsonSuccess({ event }, 201);
  } catch (error) {
    console.error("Falha ao criar evento:", error);
    return jsonError("Falha ao criar evento", 500);
  }
}
