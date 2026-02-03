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
import { StripeConnectSetup } from "@/components/stripe-connect-setup";
import { ClubPricingForm } from "@/components/club-pricing-form";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  ArrowLeft,
  Settings,
  AlertTriangle,
  Wrench,
  Users,
  CreditCard,
  DollarSign,
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
    select: { id: true, stripeConnectStatus: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
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
        },
      },
    },
  });

  const memberList = memberships.map((m) => ({
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
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
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
          />
        </CardContent>
      </Card>

      {/* Stripe Connect */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Pagamentos via Stripe
          </CardTitle>
          <CardDescription>
            Configure sua conta Stripe para receber pagamentos dos membros.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <StripeConnectSetup
            clubId={clubId}
            status={dbUser.stripeConnectStatus}
          />
        </CardContent>
      </Card>

      {/* Pricing */}
      {dbUser.stripeConnectStatus === "active" && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Preço da membresia
            </CardTitle>
            <CardDescription>
              Defina o valor mensal da assinatura para participar do clube.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ClubPricingForm
              clubId={clubId}
              currentPriceCents={club.membershipPriceCents}
            />
          </CardContent>
        </Card>
      )}

      {/* Transfer Ownership */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Transferir propriedade
          </CardTitle>
          <CardDescription>
            Transfira a propriedade deste clube para outro membro.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <TransferOwnership clubId={clubId} members={memberList} />
        </CardContent>
      </Card>

      {/* Dev Tools */}
      {isDev && memberships.length > 0 && (
        <Card className="overflow-hidden border-amber/30 bg-amber/5">
          <CardHeader className="border-b border-amber/20 bg-amber/10">
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
      <Card className="overflow-hidden border-destructive/30">
        <CardHeader className="border-b border-destructive/20 bg-destructive/5">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de perigo
          </CardTitle>
          <CardDescription>
            Exclua este clube e todos os dados permanentemente. Esta ação não
            pode ser desfeita.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <DeleteClubButton clubId={clubId} clubName={club.name} />
        </CardContent>
      </Card>
    </div>
  );
}
