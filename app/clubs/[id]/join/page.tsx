import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requirePageAuth } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ClubAvatar } from "@/components/club-avatar";
import { JoinButton } from "@/components/join-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { Shield, CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JoinClubPage({ params }: PageProps) {
  const { id } = await params;

  const { user: dbUser } = await requirePageAuth({
    returnUrl: `/clubs/${id}/join`,
    requireProfileCompleted: true,
  });

  // Fetch club with pricing and organizer connect info
  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      membershipPriceCents: true,
      stripePriceId: true,
      organizer: {
        select: {
          name: true,
          stripeConnectStatus: true,
        },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Check if already a member
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_clubId: { userId: dbUser.id, clubId: id },
    },
  });

  if (existingMembership) {
    // Already a member, redirect to club page
    redirect(`/clubs/${id}`);
  }

  const requiresPayment = (club.membershipPriceCents ?? 0) > 0;

  return (
    <div className="mx-auto max-w-lg">
      <Breadcrumb
        items={[
          { label: "Clubes", href: "/clubs" },
          { label: club.name, href: `/clubs/${id}` },
          { label: "Participar" },
        ]}
      />
      
      {/* Join Card */}
      <div className="relative overflow-hidden rounded-2xl bg-card shadow-lg">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="relative p-8">
          {/* Club Info */}
          <div className="text-center">
            <div className="mx-auto mb-4 inline-block">
              <ClubAvatar 
                name={club.name} 
                imageUrl={club.imageUrl} 
                size="xl" 
                className="ring-4 ring-background shadow-lg"
              />
            </div>
            
            <h1 
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Participar de {club.name}
            </h1>
            
            <p className="mt-1 text-sm text-muted-foreground">
              Organizado por {club.organizer.name}
            </p>

            {club.description && (
              <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
                {club.description}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-border" />

          {/* Subscription Info */}
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {requiresPayment ? "Assinatura de membresia" : "Membresia gratuita"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {requiresPayment
                      ? "Pagamento seguro via Stripe"
                      : "Sem necessidade de pagamento"}
                  </div>
                </div>
                {requiresPayment && club.membershipPriceCents && (
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {(club.membershipPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <div className="text-xs text-muted-foreground">por mês</div>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Acesso completo ao conteúdo do clube e aos membros</span>
              </div>
              {requiresPayment ? (
                <>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Cancele quando quiser, sem compromisso</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Seus dados de pagamento são processados com segurança pelo Stripe</span>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Sem cobrança — participe gratuitamente</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-border" />

          {/* Actions */}
          <div className="space-y-3">
            <JoinButton
              clubId={id}
              requiresPayment={requiresPayment}
              canAcceptPayments={
                requiresPayment
                  ? club.organizer.stripeConnectStatus === "active" &&
                    !!club.stripePriceId
                  : true
              }
              priceCents={club.membershipPriceCents}
            />
            
            <Button 
              variant="ghost" 
              asChild 
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href={`/clubs/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                Voltar ao clube
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
