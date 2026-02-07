import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClubForm } from "@/components/club-form";
import { DeleteClubButton } from "@/components/delete-club-button";
import { MemberCard } from "@/components/member-card";
import { MembershipToggle } from "@/components/membership-toggle";
import { TransferOwnership } from "@/components/transfer-ownership";
import {
  StripeConnectSetup,
  StripeConnectBadge,
} from "@/components/stripe-connect-setup";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  ArrowLeft,
  Settings,
  AlertTriangle,
  Wrench,
  Users,
  CreditCard,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { id: clubId } = await params;
  const session = await auth0.getSession();

  // Require login
  if (!session) {
    redirect("/auth/login");
  }

  // Get current user
  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, stripeConnectStatus: true, profileCompleted: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  if (!dbUser.profileCompleted) {
    redirect(`/profile?returnTo=${encodeURIComponent(`/clubs/${clubId}/settings`)}`);
  }

  // Fetch club
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      organizerId: true,
      membershipPriceCents: true,
    },
  });

  if (!club) {
    notFound();
  }

  // Require organizer access
  if (club.organizerId !== dbUser.id) {
    redirect(`/clubs/${clubId}`);
  }

  // Fetch members for dev tools and transfer ownership (excluding current organizer)
  const memberships = await prisma.membership.findMany({
    where: {
      clubId,
      role: "member",
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true,
          stripeConnectStatus: true,
        },
      },
    },
  });

  const memberList = memberships
    .filter((m) => m.user.stripeConnectStatus === "active")
    .map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    }));

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Clubes", href: "/clubs" },
          { label: club.name, href: `/clubs/${clubId}` },
          { label: "Configurações" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Configurações do clube
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os detalhes e as preferências do seu clube
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

      {/* Edit Form */}
      <Card className="overflow-hidden hover-lift pt-0">
        <CardHeader className="border-b bg-muted/30 pt-6">
          <CardTitle className="text-lg">Detalhes do clube</CardTitle>
          <CardDescription>
            Atualize o nome, a descrição e a imagem do seu clube.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ClubForm
            mode="edit"
            clubId={clubId}
            initialData={{
              name: club.name,
              description: club.description,
              imageUrl: club.imageUrl,
            }}
            membershipPriceCents={club.membershipPriceCents}
            stripeConnectActive={dbUser.stripeConnectStatus === "active"}
          />
        </CardContent>
      </Card>

      {/* Payments & Pricing */}
      <div
        id="pagamentos"
        className="scroll-mt-24 border-gradient shadow-honey-lg hover-lift isolate"
      >
        <Card className="relative gap-0 overflow-hidden border-0 bg-card/80 py-0 shadow-none">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.98_0.02_95/0.7)_0%,_transparent_60%)] opacity-60" />
          <div className="pointer-events-none absolute inset-0 pattern-honeycomb opacity-30" />
          <div className="relative">
            <div className="flex flex-col gap-4 border-b bg-muted/20 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-honey/20 text-foreground ring-1 ring-honey/40">
                  <CreditCard className="h-5 w-5 text-honey-dark" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Pagamentos</h2>
                  <p className="text-sm text-muted-foreground">
                    Conecte o Stripe e acompanhe o status da sua conta.
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <StripeConnectBadge status={dbUser.stripeConnectStatus} />
              </div>
            </div>
            <div className="p-6">
              <StripeConnectSetup
                clubId={clubId}
                status={dbUser.stripeConnectStatus}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Dev Tools */}
      {isDev && memberships.length > 0 && (
        <Card className="overflow-hidden border-amber/30 bg-amber/5 hover-lift pt-0">
          <CardHeader className="border-b border-amber/20 bg-amber/10 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-amber-600" />
              Ferramentas de desenvolvimento
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-normal text-amber-800">
                Somente desenvolvimento
              </span>
            </CardTitle>
            <CardDescription>
              Alterne o status do membro para testar as regras de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {memberships.map((membership) => (
              <MemberCard
                key={membership.id}
                id={membership.user.id}
                name={membership.user.name}
                avatarUrl={membership.user.avatarUrl}
                role={membership.role}
                status={membership.status}
                joinedAt={membership.createdAt}
                email={membership.user.email}
                toggleComponent={
                  <MembershipToggle
                    clubId={clubId}
                    userId={membership.user.id}
                    currentStatus={membership.status}
                  />
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="relative overflow-hidden border-amber/30 bg-[linear-gradient(135deg,oklch(0.985_0.02_95/0.7)_0%,transparent_60%)] hover-lift pt-0">
        <div className="pointer-events-none absolute inset-0 pattern-honeycomb opacity-20" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber/70 via-honey/40 to-transparent" />
        <CardHeader className="relative border-b border-amber/20 bg-amber/5 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                Zona crítica
              </span>
              <CardTitle className="text-2xl text-foreground">
                Zona de perigo
              </CardTitle>
              <CardDescription className="max-w-lg text-sm">
                Ações irreversíveis com impacto direto em acesso e pagamentos do
                clube.
              </CardDescription>
            </div>
            <div className="rounded-xl border border-amber/20 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
              Confirme com sua equipe antes de continuar.
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-amber/20 bg-amber/5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                Antes de continuar
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Estas mudanças afetam administradores, pagamentos e acesso ao
                clube.
              </p>
              <ul className="stagger-in mt-4 space-y-3 text-sm text-foreground/80">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber/60" />
                  Garanta que o novo organizador está alinhado com as regras.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber/60" />
                  A exclusão remove dados e assinaturas de forma permanente.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber/60" />
                  Após a transferência, você perde acesso de administrador.
                </li>
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-amber/20 bg-background/80 p-5 shadow-sm">
                <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 bg-[radial-gradient(circle,_oklch(0.82_0.14_75/0.25),transparent_70%)]" />
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-amber-700" />
                  Transferir propriedade
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Transfira o controle administrativo para outro membro.
                </p>
                <div className="mt-4">
                  <TransferOwnership clubId={clubId} members={memberList} />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-amber/30 bg-background/80 p-5 shadow-sm">
                <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 bg-[radial-gradient(circle,_oklch(0.76_0.12_65/0.25),transparent_70%)]" />
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  Excluir clube
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Exclua este clube e todos os dados permanentemente.
                </p>
                <div className="mt-4">
                  <DeleteClubButton clubId={clubId} clubName={club.name} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
