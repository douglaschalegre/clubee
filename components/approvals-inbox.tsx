"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Loader2, X, CalendarDays, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { getInitials } from "@/lib/colors";

type RsvpStatus =
  | "going"
  | "not_going"
  | "pending_payment"
  | "pending_approval"
  | "approved_pending_payment"
  | "rejected"
  | "payment_failed";

type EventInfo = {
  id: string;
  title: string;
  startsAt: string | Date;
  timezone: string;
  priceCents?: number | null;
  requiresApproval?: boolean | null;
};

type UserInfo = {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
};

type PendingRequest = {
  userId: string;
  createdAt: string | Date;
  user: UserInfo;
};

type PendingGroup = {
  event: EventInfo;
  requests: PendingRequest[];
};

type HistoryEntry = {
  userId: string;
  status: RsvpStatus;
  approvedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  rejectionReason?: string | null;
  paidAt?: string | Date | null;
  updatedAt: string | Date;
  user: UserInfo;
};

type HistoryGroup = {
  event: EventInfo;
  entries: HistoryEntry[];
};

type ActionTargets = Record<string, string[]>;

type ApprovalsInboxProps = {
  clubId: string;
  pendingGroups: PendingGroup[];
  historyGroups: HistoryGroup[];
  eventFilterId?: string | null;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function formatEventDate(date: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: timezone,
  }).format(toDate(date));
}

function formatEventTime(date: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(toDate(date));
}

function formatEventDateTime(date: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(toDate(date));
}

function formatDecisionTime(entry: HistoryEntry, timezone: string) {
  const decision = entry.approvedAt || entry.rejectedAt || entry.updatedAt;
  return formatEventDateTime(decision, timezone);
}

export function ApprovalsInbox({
  clubId,
  pendingGroups,
  historyGroups,
  eventFilterId,
}: ApprovalsInboxProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [pendingState, setPendingState] = useState(pendingGroups);
  const [historyState, setHistoryState] = useState(historyGroups);
  const [selection, setSelection] = useState<Record<string, Set<string>>>({});
  const [processingRows, setProcessingRows] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargets, setRejectTargets] = useState<ActionTargets | null>(null);

  useEffect(() => {
    setPendingState(pendingGroups);
  }, [pendingGroups]);

  useEffect(() => {
    setHistoryState(historyGroups);
  }, [historyGroups]);

  const pendingCount = useMemo(
    () => pendingState.reduce((sum, group) => sum + group.requests.length, 0),
    [pendingState]
  );

  const historyCount = useMemo(
    () => historyState.reduce((sum, group) => sum + group.entries.length, 0),
    [historyState]
  );

  const selectedCount = useMemo(() => {
    return Object.values(selection).reduce((sum, set) => sum + set.size, 0);
  }, [selection]);

  function setRowProcessing(eventId: string, userId: string, value: boolean) {
    setProcessingRows((prev) => {
      const next = new Set(prev);
      const key = `${eventId}:${userId}`;
      if (value) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  function isRowProcessing(eventId: string, userId: string) {
    return processingRows.has(`${eventId}:${userId}`);
  }

  function updateSelection(eventId: string, userId: string, checked: boolean) {
    setSelection((prev) => {
      const next = { ...prev };
      const set = new Set(next[eventId] ?? []);
      if (checked) {
        set.add(userId);
      } else {
        set.delete(userId);
      }
      if (set.size === 0) {
        delete next[eventId];
      } else {
        next[eventId] = set;
      }
      return next;
    });
  }

  function clearSelection() {
    setSelection({});
  }

  function buildTargetsFromSelection(): ActionTargets {
    const targets: ActionTargets = {};
    for (const [eventId, users] of Object.entries(selection)) {
      if (users.size > 0) {
        targets[eventId] = Array.from(users);
      }
    }
    return targets;
  }

  function applyDecisionOptimistic(
    targets: ActionTargets,
    action: "approve" | "reject",
    reason?: string
  ) {
    const now = new Date().toISOString();

    setPendingState((prev) => {
      return prev
        .map((group) => {
          const selectedUserIds = targets[group.event.id];
          if (!selectedUserIds || selectedUserIds.length === 0) {
            return group;
          }
          const remaining = group.requests.filter(
            (request) => !selectedUserIds.includes(request.userId)
          );
          return { ...group, requests: remaining };
        })
        .filter((group) => group.requests.length > 0);
    });

    setHistoryState((prev) => {
      let next = [...prev];

      for (const [eventId, userIds] of Object.entries(targets)) {
        if (userIds.length === 0) continue;
        const group = pendingState.find((g) => g.event.id === eventId);
        if (!group) continue;

        const newEntries = group.requests
          .filter((request) => userIds.includes(request.userId))
          .map((request) => {
            const isPaidEvent = (group.event.priceCents ?? 0) > 0;
            const status: RsvpStatus =
              action === "approve"
                ? isPaidEvent
                  ? "approved_pending_payment"
                  : "going"
                : "rejected";

            return {
              userId: request.userId,
              user: request.user,
              status,
              approvedAt: action === "approve" ? now : null,
              rejectedAt: action === "reject" ? now : null,
              rejectionReason: action === "reject" ? reason ?? null : null,
              paidAt: null,
              updatedAt: now,
            } as HistoryEntry;
          });

        if (newEntries.length === 0) continue;

        const existingIndex = next.findIndex((g) => g.event.id === eventId);
        if (existingIndex >= 0) {
          const existing = next[existingIndex];
          next[existingIndex] = {
            ...existing,
            entries: [...newEntries, ...existing.entries],
          };
        } else {
          next = [{ event: group.event, entries: newEntries }, ...next];
        }
      }

      return next;
    });
  }

  async function runBulkAction(
    action: "approve" | "reject",
    targets: ActionTargets,
    reason?: string
  ) {
    setErrorMessage(null);
    if (Object.keys(targets).length === 0) return;

    setBulkProcessing(true);

    const successes: ActionTargets = {};
    let totalUpdated = 0;
    const errors: string[] = [];

    for (const [eventId, userIds] of Object.entries(targets)) {
      if (userIds.length === 0) continue;
      try {
        const res = await fetch(
          `/api/clubs/${clubId}/events/${eventId}/requests/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              userIds,
              rejectionReason: reason,
            }),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Falha ao processar solicitações");
        }

        successes[eventId] = userIds;
        totalUpdated += Number(data.updatedCount || 0);
      } catch (error) {
        errors.push(
          error instanceof Error ? error.message : "Falha ao processar"
        );
      }
    }

    if (Object.keys(successes).length > 0) {
      applyDecisionOptimistic(successes, action, reason);
      clearSelection();
      router.refresh();
    }

    if (errors.length > 0) {
      setErrorMessage(errors[0]);
      toast.error(errors[0]);
    } else if (Object.keys(successes).length > 0) {
      toast.success(
        action === "approve"
          ? `${totalUpdated} aprovações concluídas!`
          : `${totalUpdated} solicitações rejeitadas.`
      );
    }

    setBulkProcessing(false);
  }

  async function handleSingleAction(
    eventId: string,
    userId: string,
    action: "approve" | "reject",
    reason?: string
  ) {
    setRowProcessing(eventId, userId, true);
    await runBulkAction(action, { [eventId]: [userId] }, reason);
    setRowProcessing(eventId, userId, false);
  }

  function openRejectDialog(targets: ActionTargets) {
    setRejectTargets(targets);
    setRejectReason("");
    setRejectDialogOpen(true);
  }

  async function confirmReject() {
    if (!rejectTargets) return;
    const targets = rejectTargets;
    setRejectDialogOpen(false);
    setRejectTargets(null);
    await runBulkAction("reject", targets, rejectReason.trim() || undefined);
  }

  const showBulkBar = selectedCount > 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8">
      <div className="absolute inset-0 pattern-honeycomb opacity-30" />
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber/10 blur-3xl" />

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                Pendentes
                <Badge variant="secondary" className="px-2 py-0.5">
                  {pendingCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                Histórico
                <Badge variant="secondary" className="px-2 py-0.5">
                  {historyCount}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {eventFilterId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/60 bg-background/70 px-2 py-1">
                  Filtrando por evento
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => router.push(`/clubs/${clubId}/approvals`)}
                >
                  Limpar filtro
                </Button>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <TabsContent value="pending" className="space-y-4">
          {showBulkBar && (
            <div className="sticky top-2 z-10 rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedCount} selecionada{selectedCount === 1 ? "" : "s"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={bulkProcessing}
                    onClick={() =>
                      runBulkAction("approve", buildTargetsFromSelection())
                    }
                  >
                    {bulkProcessing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    Aprovar selecionadas
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkProcessing}
                    onClick={() =>
                      openRejectDialog(buildTargetsFromSelection())
                    }
                  >
                    <X className="size-3.5" />
                    Rejeitar selecionadas
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    disabled={bulkProcessing}
                  >
                    Limpar seleção
                  </Button>
                </div>
              </div>
            </div>
          )}

          {pendingState.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
              Nenhuma solicitação pendente.
            </div>
          ) : (
            pendingState.map((group) => {
              const dateLabel = formatEventDate(group.event.startsAt, group.event.timezone);
              const timeLabel = formatEventTime(group.event.startsAt, group.event.timezone);
              const isPaid = (group.event.priceCents ?? 0) > 0;

              return (
                <div
                  key={group.event.id}
                  className="rounded-2xl border border-border/60 bg-background/80 shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {group.event.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                          {dateLabel} · {timeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isPaid ? (
                        <Badge variant="secondary">
                          {formatCurrency(group.event.priceCents!)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Gratuito</Badge>
                      )}
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {group.requests.length} pendente
                      </Badge>
                    </div>
                  </div>

                  <div className="divide-y divide-border/60">
                    {group.requests.map((request) => {
                      const checked =
                        selection[group.event.id]?.has(request.userId) ?? false;
                      const disabled =
                        bulkProcessing || isRowProcessing(group.event.id, request.userId);

                      return (
                        <div
                          key={request.userId}
                          className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center"
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                updateSelection(
                                  group.event.id,
                                  request.userId,
                                  e.target.checked
                                )
                              }
                              className={cn(
                                "size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring/50",
                                disabled && "opacity-50"
                              )}
                              disabled={disabled}
                            />

                            <Avatar className="h-10 w-10 ring-2 ring-background shadow">
                              {request.user.avatarUrl && (
                                <AvatarImage src={request.user.avatarUrl} />
                              )}
                              <AvatarFallback>
                                {getInitials(request.user.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {request.user.name}
                              </p>
                              {request.user.email && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {request.user.email}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground sm:text-right">
                            Solicitado em {formatEventDateTime(request.createdAt, group.event.timezone)}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              disabled={disabled}
                              onClick={() =>
                                handleSingleAction(group.event.id, request.userId, "approve")
                              }
                            >
                              {isRowProcessing(group.event.id, request.userId) ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={disabled}
                              onClick={() =>
                                openRejectDialog({ [group.event.id]: [request.userId] })
                              }
                            >
                              <X className="size-3.5" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

          <TabsContent value="history" className="space-y-4">
          {historyState.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
              Sem histórico de aprovações ainda.
            </div>
          ) : (
            historyState.map((group) => {
              const dateLabel = formatEventDate(group.event.startsAt, group.event.timezone);
              const timeLabel = formatEventTime(group.event.startsAt, group.event.timezone);
              const isPaid = (group.event.priceCents ?? 0) > 0;

              return (
                <div
                  key={group.event.id}
                  className="rounded-2xl border border-border/60 bg-background/80 shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {group.event.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                          {dateLabel} · {timeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isPaid ? (
                        <Badge variant="secondary">
                          {formatCurrency(group.event.priceCents!)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Gratuito</Badge>
                      )}
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {group.entries.length} histórico
                      </Badge>
                    </div>
                  </div>

                  <div className="divide-y divide-border/60">
                    {group.entries.map((entry) => {
                      const statusLabel =
                        entry.status === "rejected"
                          ? "Rejeitado"
                          : "Aprovado";

                      const statusClass =
                        entry.status === "rejected"
                          ? "border-rose-200 bg-rose-50/70 text-rose-700"
                          : "border-emerald-200 bg-emerald-50/70 text-emerald-700";

                      const paymentBadge =
                        entry.status === "approved_pending_payment"
                          ? "Pagamento pendente"
                          : entry.paidAt
                            ? "Pago"
                            : entry.status === "payment_failed"
                              ? "Pagamento falhou"
                              : null;

                      const paymentClass =
                        entry.status === "payment_failed"
                          ? "border-rose-200 bg-rose-50/70 text-rose-700"
                          : "border-amber-200 bg-amber-50/70 text-amber-700";

                      return (
                        <div
                          key={`${entry.userId}-${entry.updatedAt}`}
                          className="flex flex-col gap-3 px-4 py-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 ring-2 ring-background shadow">
                                {entry.user.avatarUrl && (
                                  <AvatarImage src={entry.user.avatarUrl} />
                                )}
                                <AvatarFallback>
                                  {getInitials(entry.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {entry.user.name}
                                </p>
                                {entry.user.email && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {entry.user.email}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <Badge variant="outline" className={statusClass}>
                                {statusLabel}
                              </Badge>
                              {paymentBadge && (
                                <Badge variant="outline" className={paymentClass}>
                                  {paymentBadge}
                                </Badge>
                              )}
                              <span className="text-muted-foreground">
                                {formatDecisionTime(entry, group.event.timezone)}
                              </span>
                            </div>
                          </div>

                          {entry.rejectionReason && (
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                              Motivo: {entry.rejectionReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitações</DialogTitle>
            <DialogDescription>
              Opcionalmente informe um motivo para a rejeição.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Ex: capacidade lotada, evento exclusivo para membros"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={confirmReject}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
