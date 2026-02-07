import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { updateEventSchema } from "@/lib/validations/event";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { naiveDateTimeToUTC } from "@/lib/timezone";
import { RESERVED_RSVP_STATUSES } from "@/lib/event-capacity";
import {
  createEventProduct,
  createEventPrice,
  updateEventPrice,
} from "@/lib/stripe";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
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
        timezone: event.timezone,
      },
      canViewDetails: false,
    });
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, stripeConnectAccountId: true, stripeConnectChargesEnabled: true },
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
    select: {
      id: true,
      stripeConnectAccountId: true,
      stripeConnectChargesEnabled: true,
    },
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

  // Convert price from R$ to cents if provided
  const priceCents = data.price !== undefined
    ? (data.price ? Math.round(data.price * 100) : null)
    : undefined;
  const maxCapacity = data.maxCapacity;

  try {
    const needsExistingEvent =
      (data.startsAt !== undefined && data.timezone === undefined) ||
      priceCents !== undefined;

    const existingEvent = needsExistingEvent
      ? await prisma.event.findFirst({
          where: { id: eventId, clubId },
          select: {
            title: true,
            timezone: true,
            priceCents: true,
            stripeProductId: true,
            stripePriceId: true,
            rsvps: {
              where: { status: "going" },
              select: { id: true },
            },
          },
        })
      : null;

    if (needsExistingEvent && !existingEvent) {
      return jsonError("Evento não encontrado", 404);
    }

    // If startsAt is being updated, resolve the timezone for conversion
    let startsAtUTC: Date | undefined;
    if (data.startsAt !== undefined) {
      let tz = data.timezone;
      if (!tz) {
        tz = existingEvent?.timezone;
      }
      if (!tz) {
        return jsonError("Fuso horário obrigatório ao alterar a data", 400);
      }
      startsAtUTC = naiveDateTimeToUTC(data.startsAt, tz);
    }

    if (maxCapacity !== undefined && maxCapacity !== null) {
      const reservedCount = await prisma.eventRsvp.count({
        where: {
          eventId,
          status: { in: [...RESERVED_RSVP_STATUSES] },
        },
      });

      if (reservedCount > maxCapacity) {
        return jsonError(
          "Capacidade menor do que as reservas atuais",
          409
        );
      }
    }

    let stripeProductId: string | null | undefined;
    let stripePriceId: string | null | undefined;

    if (priceCents !== undefined) {
      const currentPriceCents = existingEvent?.priceCents ?? null;
      const priceChanged = priceCents !== currentPriceCents;

      if (priceChanged && existingEvent?.rsvps?.length) {
        return jsonError(
          "Não é possível alterar o preço depois de RSVPs confirmados",
          400
        );
      }

      if (!priceCents || priceCents === 0) {
        stripeProductId = null;
        stripePriceId = null;
      } else {
        if (!dbUser.stripeConnectAccountId || !dbUser.stripeConnectChargesEnabled) {
          return jsonError(
            "Configure sua conta Stripe Connect antes de criar eventos pagos",
            400
          );
        }

        if (existingEvent?.stripeProductId && existingEvent?.stripePriceId) {
          if (priceChanged) {
            const newPrice = await updateEventPrice(
              existingEvent.stripeProductId,
              existingEvent.stripePriceId,
              priceCents
            );
            stripeProductId = existingEvent.stripeProductId;
            stripePriceId = newPrice.id;
          }
        } else if (existingEvent?.stripeProductId) {
          const newPrice = await createEventPrice(
            existingEvent.stripeProductId,
            priceCents
          );
          stripeProductId = existingEvent.stripeProductId;
          stripePriceId = newPrice.id;
        } else {
          const { product, price } = await createEventProduct(
            data.title ?? existingEvent?.title ?? "Evento",
            priceCents
          );
          stripeProductId = product.id;
          stripePriceId = price.id;
        }
      }
    }

    const event = await prisma.event.update({
      where: { id: eventId, clubId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(startsAtUTC !== undefined && { startsAt: startsAtUTC }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.locationType !== undefined && { locationType: data.locationType }),
        ...(data.locationValue !== undefined && { locationValue: data.locationValue }),
        ...(priceCents !== undefined && { priceCents }),
        ...(stripeProductId !== undefined && { stripeProductId }),
        ...(stripePriceId !== undefined && { stripePriceId }),
        ...(data.requiresApproval !== undefined && { requiresApproval: data.requiresApproval }),
        ...(maxCapacity !== undefined && { maxCapacity }),
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
