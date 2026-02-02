"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubAvatar } from "@/components/club-avatar";
import { MembershipStatusBadge } from "@/components/membership-status-badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowRight, CreditCard, Crown, Users, AlertCircle, CheckCircle2 } from "lucide-react";

type ClubSummary = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  membershipPriceCents: number | null;
  stripePriceId: string | null;
  _count: { memberships: number };
};

type MembershipSummary = {
  id: string;
  status: "active" | "inactive";
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  club: ClubSummary;
};

type ViewMode = "organizing" | "member";

type ConnectStatus =
  | "not_started"
  | "onboarding_started"
  | "onboarding_incomplete"
  | "active"
  | "restricted"
  | "disabled";

interface MyClubsViewProps {
  organizingClubs: ClubSummary[];
  memberMemberships: MembershipSummary[];
  connectStatus: ConnectStatus;
  initialView?: ViewMode;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MyClubsView({
  organizingClubs,
  memberMemberships,
  connectStatus,
  initialView = "organizing",
}: MyClubsViewProps) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [isManaging, setIsManaging] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);

  async function handleManageSubscription(membershipId: string) {
    setIsManaging(membershipId);
    setManageError(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      });

      const text = await res.text();
      if (!text) {
        throw new Error(`Resposta vazia do servidor (status: ${res.status})`);
      }

      let data: { url?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta JSON inválida: ${text.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Falha ao abrir o portal de cobrança");
      }

      if (!data.url) {
        throw new Error("Nenhuma URL de portal retornada");
      }

      window.location.href = data.url;
    } catch (err) {
      setManageError(
        err instanceof Error ? err.message : "Falha ao abrir o portal"
      );
      setIsManaging(null);
    }
  }

  return (
    <>
      <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Meus clubes
              </h1>
              <p className="text-sm text-muted-foreground">
                {view === "organizing"
                  ? `${organizingClubs.length} ${organizingClubs.length === 1 ? "clube" : "clubes"}`
                  : `${memberMemberships.length} ${memberMemberships.length === 1 ? "assinatura" : "assinaturas"} como membro`}
              </p>
            </div>
          </div>

          <TabsList>
            <TabsTrigger value="organizing">Organizador</TabsTrigger>
            <TabsTrigger value="member">Membro</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="organizing">
          {organizingClubs.length === 0 ? (
            <section className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border/60 p-10 text-center">
              <div className="absolute inset-0 pattern-honeycomb opacity-30" />
              <div className="relative space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <span className="text-2xl">🐝</span>
              </div>
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Você ainda não organiza clubes
              </h2>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Crie um clube para começar a receber membros e gerenciar sua
                comunidade.
              </p>
              <Button asChild className="shadow-honey">
                <Link href="/clubs/new">Criar clube</Link>
              </Button>
            </div>
          </section>
        ) : (
          <section className="stagger-in grid gap-4">
            {organizingClubs.map((club) => (
              <article
                key={club.id}
                className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-honey"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="shrink-0">
                    <ClubAvatar
                      name={club.name}
                      imageUrl={club.imageUrl}
                      size="md"
                      className="ring-2 ring-background shadow"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className="truncate text-lg font-semibold"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {club.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="gap-1 border-primary/30 bg-primary/5 text-primary"
                      >
                        <Crown className="h-3 w-3" />
                        Organizador
                      </Badge>
                    </div>
                    {club.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {club.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {club._count.memberships} {club._count.memberships === 1 ? "membro" : "membros"}
                      </span>
                      {connectStatus === "active" && club.stripePriceId ? (
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {club.membershipPriceCents
                            ? `${(club.membershipPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês`
                            : "Pagamentos ativos"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          Pagamentos pendentes
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {connectStatus !== "active" || !club.stripePriceId ? (
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/clubs/${club.id}/settings`}>
                          Configurar pagamentos
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild className="gap-2">
                      <Link href={`/clubs/${club.id}`}>
                        Ver clube
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
        </TabsContent>

        <TabsContent value="member">
          {memberMemberships.length === 0 ? (
            <section className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border/60 p-10 text-center">
              <div className="absolute inset-0 pattern-honeycomb opacity-30" />
              <div className="relative space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <span className="text-2xl">🍯</span>
                </div>
                <h2
                  className="text-xl font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Você ainda não participa de clubes
                </h2>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  Explore clubes e assine quando encontrar a comunidade perfeita.
                </p>
                <Button asChild variant="outline">
                  <Link href="/clubs">Explorar clubes</Link>
                </Button>
              </div>
            </section>
          ) : (
            <section className="stagger-in grid gap-4">
              {manageError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {manageError}
                </div>
              )}
              {memberMemberships.map((membership) => {
                const billingInfo = membership.currentPeriodEnd
                  ? `Renova em ${formatDate(membership.currentPeriodEnd)}`
                  : "Sem assinatura ativa";

                return (
                  <article
                    key={membership.id}
                    className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-honey"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="shrink-0">
                        <ClubAvatar
                          name={membership.club.name}
                          imageUrl={membership.club.imageUrl}
                          size="md"
                          className="ring-2 ring-background shadow"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className="truncate text-lg font-semibold"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {membership.club.name}
                          </h3>
                          <Badge variant="outline" className="gap-1 border-border/60">
                            <Users className="h-3 w-3" />
                            Membro
                          </Badge>
                          <MembershipStatusBadge status={membership.status} />
                        </div>
                        {membership.club.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {membership.club.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            {membership.club._count.memberships} {membership.club._count.memberships === 1 ? "membro" : "membros"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4" />
                            {billingInfo}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button asChild className="gap-2">
                          <Link href={`/clubs/${membership.club.id}`}>
                            Ver clube
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!membership.stripeSubscriptionId || isManaging === membership.id}
                          onClick={() => handleManageSubscription(membership.id)}
                          title={
                            membership.stripeSubscriptionId
                              ? ""
                              : "Sem assinatura ativa"
                          }
                        >
                          {isManaging === membership.id
                            ? "Abrindo portal..."
                            : "Gerenciar assinatura"}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
