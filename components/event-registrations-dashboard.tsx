"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Users,
  XCircle,
  AlertTriangle,
  UserX,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getInitials } from "@/lib/colors";
import { getRsvpStatusBadge, type RsvpStatus } from "@/lib/event-rsvp-ui";
import { RESERVED_RSVP_STATUSES } from "@/lib/event-capacity";

export type RegistrationEvent = {
  id: string;
  title: string;
  startsAt: string;
  timezone: string;
  priceCents: number | null;
  requiresApproval: boolean;
  maxCapacity: number | null;
};

type RegistrationUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

type RegistrationRsvp = {
  id: string;
  status: NonNullable<RsvpStatus>;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  paidAt: string | null;
  paidAmountCents: number | null;
  updatedAt: string;
  user: RegistrationUser;
};

type EventRegistrationsDashboardProps = {
  clubId: string;
  event: RegistrationEvent;
  rsvps: RegistrationRsvp[];
};

type StatusFilter =
  | "all"
  | "going"
  | "pending_approval"
  | "pending_payment"
  | "payment_failed"
  | "rejected"
  | "not_going";

const STATUS_ORDER: NonNullable<RsvpStatus>[] = [
  "going",
  "pending_approval",
  "approved_pending_payment",
  "pending_payment",
  "payment_failed",
  "rejected",
  "not_going",
];

const STATUS_LABELS: Record<NonNullable<RsvpStatus>, string> = {
  going: "Registrados",
  pending_approval: "Pendentes de aprovação",
  approved_pending_payment: "Aprovados · pagamento pendente",
  pending_payment: "Pagamento pendente",
  payment_failed: "Pagamento falhou",
  rejected: "Rejeitados",
  not_going: "Não vão",
};

const STATUS_ACCENTS: Record<NonNullable<RsvpStatus>, string> = {
  going: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
  pending_approval: "border-slate-200 bg-slate-50/80 text-slate-700",
  approved_pending_payment: "border-amber-200 bg-amber-50/80 text-amber-800",
  pending_payment: "border-amber-200 bg-amber-50/80 text-amber-800",
  payment_failed: "border-rose-200 bg-rose-50/80 text-rose-700",
  rejected: "border-rose-200 bg-rose-50/80 text-rose-700",
  not_going: "border-zinc-200 bg-zinc-50/80 text-zinc-700",
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Todos os status",
  going: "Registrados",
  pending_approval: "Pendentes de aprovação",
  pending_payment: "Pendentes de pagamento",
  payment_failed: "Pagamento falhou",
  rejected: "Rejeitados",
  not_going: "Não vão",
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function formatDate(date: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(toDate(date));
}

function formatTime(date: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(toDate(date));
}

function formatDateTime(date: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(toDate(date));
}

export function EventRegistrationsDashboard({
  clubId,
  event,
  rsvps,
}: EventRegistrationsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredRsvps = useMemo(() => {
    if (!normalizedQuery && statusFilter === "all") {
      return rsvps;
    }

    return rsvps.filter((rsvp) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        rsvp.user.name.toLowerCase().includes(normalizedQuery) ||
        (rsvp.user.email ?? "").toLowerCase().includes(normalizedQuery) ||
        (rsvp.user.phone ?? "").toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending_payment"
            ? ["pending_payment", "approved_pending_payment"].includes(
                rsvp.status
              )
            : rsvp.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [rsvps, normalizedQuery, statusFilter]);

  const filteredCount = filteredRsvps.length;

  const statusCounts = rsvps.reduce<Record<string, number>>((acc, rsvp) => {
    acc[rsvp.status] = (acc[rsvp.status] ?? 0) + 1;
    return acc;
  }, {});

  const registeredCount = statusCounts.going ?? 0;
  const pendingApprovalCount = statusCounts.pending_approval ?? 0;
  const pendingPaymentCount =
    (statusCounts.pending_payment ?? 0) +
    (statusCounts.approved_pending_payment ?? 0);
  const paymentFailedCount = statusCounts.payment_failed ?? 0;
  const rejectedCount = statusCounts.rejected ?? 0;
  const notGoingCount = statusCounts.not_going ?? 0;
  const totalCount = rsvps.length;

  const reservedCount = rsvps.filter((rsvp) =>
    RESERVED_RSVP_STATUSES.includes(
      rsvp.status as (typeof RESERVED_RSVP_STATUSES)[number]
    )
  ).length;

  const eventDate = formatDate(event.startsAt, event.timezone);
  const eventTime = formatTime(event.startsAt, event.timezone);

  const statusGroups = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    entries: filteredRsvps
      .filter((entry) => entry.status === status)
      .sort(
        (a, b) =>
          toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime()
      ),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
        <div className="absolute inset-0 pattern-honeycomb opacity-30" />
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Inscrições do evento
                </h1>
                <p className="text-sm text-muted-foreground">
                  {event.title} · {eventDate} · {eventTime} ({event.timezone})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild className="gap-2 shrink-0">
                <Link href={`/clubs/${clubId}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao clube
                </Link>
              </Button>
              {event.requiresApproval && (
                <Button variant="ghost" asChild className="gap-2 shrink-0">
                  <Link href={`/clubs/${clubId}/approvals?eventId=${event.id}`}>
                    <Clock className="h-4 w-4" />
                    Ver aprovações
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {event.priceCents && event.priceCents > 0 ? (
              <Badge variant="secondary">{formatCurrency(event.priceCents)}</Badge>
            ) : (
              <Badge variant="outline">Gratuito</Badge>
            )}
            {event.requiresApproval && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Requer aprovação
              </Badge>
            )}
            {event.maxCapacity !== null && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {reservedCount}/{event.maxCapacity} vagas
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              Total: {totalCount}
            </Badge>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <div className="absolute inset-0 pattern-honeycomb opacity-30" />
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber/10 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="sm:w-56">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_FILTER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery.length > 0 || statusFilter !== "all") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Mostrando {filteredCount} de {totalCount}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Registrados", value: registeredCount, accent: "text-emerald-700" },
              { label: "Pendentes de aprovação", value: pendingApprovalCount, accent: "text-slate-700" },
              { label: "Pendentes de pagamento", value: pendingPaymentCount, accent: "text-amber-700" },
              { label: "Pagamento falhou", value: paymentFailedCount, accent: "text-rose-700" },
              { label: "Rejeitados", value: rejectedCount, accent: "text-rose-700" },
              { label: "Não vão", value: notGoingCount, accent: "text-zinc-700" },
              { label: "Total", value: totalCount, accent: "text-primary" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${item.accent}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {rsvps.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
              Nenhuma inscrição registrada para este evento ainda.
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
              Nenhum resultado com esses filtros. Tente ajustar a busca.
            </div>
          ) : (
            <div className="space-y-6">
              {statusGroups.map((group) => (
                <div key={group.status} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        STATUS_ACCENTS[group.status]
                      }`}
                    >
                      {group.label}
                    </span>
                    <Badge variant="secondary">{group.entries.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {group.entries.map((entry) => {
                      const statusBadge = getRsvpStatusBadge(entry.status);
                      const createdAt = formatDateTime(
                        entry.createdAt,
                        event.timezone
                      );
                      const approvedAt = entry.approvedAt
                        ? formatDateTime(entry.approvedAt, event.timezone)
                        : null;
                      const rejectedAt = entry.rejectedAt
                        ? formatDateTime(entry.rejectedAt, event.timezone)
                        : null;
                      const paidAt = entry.paidAt
                        ? formatDateTime(entry.paidAt, event.timezone)
                        : null;

                      return (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-11 w-11 ring-2 ring-background shadow">
                                {entry.user.avatarUrl && (
                                  <AvatarImage src={entry.user.avatarUrl} />
                                )}
                                <AvatarFallback className="text-sm font-medium">
                                  {getInitials(entry.user.name)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold">
                                    {entry.user.name}
                                  </span>
                                  {statusBadge ? (
                                    <Badge
                                      variant={statusBadge.variant}
                                      className={statusBadge.className}
                                    >
                                      <statusBadge.icon />
                                      {statusBadge.label}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="gap-1">
                                      <UserX className="h-3 w-3" />
                                      Não vai
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {entry.user.email && <span>{entry.user.email}</span>}
                                  {entry.user.phone && <span>{entry.user.phone}</span>}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    RSVP em {createdAt}
                                  </span>
                                  {approvedAt && (
                                    <span className="inline-flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                      Aprovado em {approvedAt}
                                    </span>
                                  )}
                                  {rejectedAt && (
                                    <span className="inline-flex items-center gap-1">
                                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                      Rejeitado em {rejectedAt}
                                    </span>
                                  )}
                                  {paidAt && (
                                    <span className="inline-flex items-center gap-1">
                                      <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                                      Pago em {paidAt}
                                      {entry.paidAmountCents !== null
                                        ? ` (${formatCurrency(entry.paidAmountCents)})`
                                        : ""}
                                    </span>
                                  )}
                                </div>

                                {entry.rejectionReason && (
                                  <div className="rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-700">
                                    <div className="flex items-center gap-2 font-semibold">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      Motivo da rejeição
                                    </div>
                                    <p className="mt-1 text-rose-700/90">
                                      {entry.rejectionReason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Última atualização: {formatDateTime(entry.updatedAt, event.timezone)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
