import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApprovalsInbox } from "@/components/approvals-inbox";
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
}

function decisionAt(entry: {
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  updatedAt: Date;
}) {
  return entry.approvedAt ?? entry.rejectedAt ?? entry.updatedAt;
}

export default async function ApprovalsPage({ params, searchParams }: PageProps) {
  const { id: clubId } = await params;
  const { eventId } = await searchParams;
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, profileCompleted: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  if (!dbUser.profileCompleted) {
    const returnTo = eventId
      ? `/clubs/${clubId}/approvals?eventId=${eventId}`
      : `/clubs/${clubId}/approvals`;
    redirect(`/profile?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      name: true,
      organizerId: true,
    },
  });

  if (!club) {
    notFound();
  }

  if (club.organizerId !== dbUser.id) {
    redirect(`/clubs/${clubId}`);
  }

  const eventFilter = eventId ? { id: eventId } : undefined;

  const pendingRows = await prisma.eventRsvp.findMany({
    where: {
      status: "pending_approval",
      event: {
        clubId,
        requiresApproval: true,
        ...(eventFilter ? eventFilter : {}),
      },
    },
    orderBy: { createdAt: "asc" },
    select: {
      userId: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          timezone: true,
          priceCents: true,
          requiresApproval: true,
        },
      },
    },
  });

  const historyRows = await prisma.eventRsvp.findMany({
    where: {
      status: {
        in: ["rejected", "approved_pending_payment", "going", "payment_failed"],
      },
      event: {
        clubId,
        requiresApproval: true,
        ...(eventFilter ? eventFilter : {}),
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      userId: true,
      status: true,
      approvedAt: true,
      rejectedAt: true,
      rejectionReason: true,
      paidAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          timezone: true,
          priceCents: true,
          requiresApproval: true,
        },
      },
    },
  });

  const pendingMap = new Map<string, {
    event: {
      id: string;
      title: string;
      startsAt: string;
      timezone: string;
      priceCents: number | null;
      requiresApproval: boolean;
    };
    requests: Array<{
      userId: string;
      createdAt: string;
      user: { id: string; name: string; email: string | null; avatarUrl: string | null };
    }>;
  }>();

  for (const row of pendingRows) {
    const event = row.event;
    if (!pendingMap.has(event.id)) {
      pendingMap.set(event.id, {
        event: {
          id: event.id,
          title: event.title,
          startsAt: event.startsAt.toISOString(),
          timezone: event.timezone,
          priceCents: event.priceCents,
          requiresApproval: event.requiresApproval,
        },
        requests: [],
      });
    }

    pendingMap.get(event.id)!.requests.push({
      userId: row.userId,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email ?? null,
        avatarUrl: row.user.avatarUrl ?? null,
      },
    });
  }

  const pendingGroups = Array.from(pendingMap.values())
    .map((group) => ({
      ...group,
      requests: [...group.requests].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    }))
    .sort(
      (a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime()
    );

  const historyMap = new Map<string, {
    event: {
      id: string;
      title: string;
      startsAt: string;
      timezone: string;
      priceCents: number | null;
      requiresApproval: boolean;
    };
    entries: Array<{
      userId: string;
      status: "rejected" | "approved_pending_payment" | "going" | "payment_failed";
      approvedAt: string | null;
      rejectedAt: string | null;
      rejectionReason: string | null;
      paidAt: string | null;
      updatedAt: string;
      user: { id: string; name: string; email: string | null; avatarUrl: string | null };
    }>;
  }>();

  for (const row of historyRows) {
    const event = row.event;
    if (!historyMap.has(event.id)) {
      historyMap.set(event.id, {
        event: {
          id: event.id,
          title: event.title,
          startsAt: event.startsAt.toISOString(),
          timezone: event.timezone,
          priceCents: event.priceCents,
          requiresApproval: event.requiresApproval,
        },
        entries: [],
      });
    }

    historyMap.get(event.id)!.entries.push({
      userId: row.userId,
      status: row.status as "rejected" | "approved_pending_payment" | "going" | "payment_failed",
      approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
      rejectedAt: row.rejectedAt ? row.rejectedAt.toISOString() : null,
      rejectionReason: row.rejectionReason ?? null,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      updatedAt: row.updatedAt.toISOString(),
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email ?? null,
        avatarUrl: row.user.avatarUrl ?? null,
      },
    });
  }

  const historyGroups = Array.from(historyMap.values()).map((group) => ({
    ...group,
    entries: [...group.entries].sort((a, b) => {
      const aDecision = decisionAt({
        approvedAt: a.approvedAt ? new Date(a.approvedAt) : null,
        rejectedAt: a.rejectedAt ? new Date(a.rejectedAt) : null,
        updatedAt: new Date(a.updatedAt),
      }).getTime();
      const bDecision = decisionAt({
        approvedAt: b.approvedAt ? new Date(b.approvedAt) : null,
        rejectedAt: b.rejectedAt ? new Date(b.rejectedAt) : null,
        updatedAt: new Date(b.updatedAt),
      }).getTime();
      return bDecision - aDecision;
    }),
  }));

  const pendingCount = pendingRows.length;
  const rejectedCount = historyRows.filter((row) => row.status === "rejected").length;
  const approvedCount = historyRows.length - rejectedCount;

  const eventFilterLabel = eventId
    ? pendingGroups[0]?.event.title ?? historyGroups[0]?.event.title
    : null;

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Clubes", href: "/clubs" },
          { label: club.name, href: `/clubs/${clubId}` },
          { label: "Aprovações" },
        ]}
      />

      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
        <div className="absolute inset-0 pattern-honeycomb opacity-30" />
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Aprovações de eventos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Revise solicitações de participação e histórico do clube.
                </p>
              </div>
            </div>

            <Button variant="outline" asChild className="gap-2 shrink-0">
              <Link href={`/clubs/${clubId}`}>
                <ArrowLeft className="h-4 w-4" />
                Voltar ao clube
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Pendentes: {pendingCount}
            </Badge>
            <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50/70 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Aprovadas: {approvedCount}
            </Badge>
            <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50/70 text-rose-700">
              <XCircle className="h-3 w-3" />
              Rejeitadas: {rejectedCount}
            </Badge>
            {eventFilterLabel && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50/70 text-amber-800">
                Evento: {eventFilterLabel}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <ApprovalsInbox
        clubId={clubId}
        pendingGroups={pendingGroups}
        historyGroups={historyGroups}
        eventFilterId={eventId ?? null}
      />
    </div>
  );
}
