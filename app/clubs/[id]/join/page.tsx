import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
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
  const session = await auth0.getSession();

  // Require login
  if (!session) {
    redirect("/auth/login");
  }

  // Fetch club
  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      organizer: {
        select: { name: true },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Check if already a member
  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });

  if (dbUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: { userId: dbUser.id, clubId: id },
      },
    });

    if (existingMembership) {
      // Already a member, redirect to club page
      redirect(`/clubs/${id}`);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Breadcrumb
        items={[
          { label: "Clubs", href: "/clubs" },
          { label: club.name, href: `/clubs/${id}` },
          { label: "Join" },
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
              Join {club.name}
            </h1>
            
            <p className="mt-1 text-sm text-muted-foreground">
              Organized by {club.organizer.name}
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
                <div>
                  <div className="font-semibold">Membership Subscription</div>
                  <div className="text-sm text-muted-foreground">
                    Secure payment via Stripe
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Full access to club content and members</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Cancel anytime, no commitments</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Your payment info is securely processed by Stripe</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-border" />

          {/* Actions */}
          <div className="space-y-3">
            <JoinButton clubId={id} />
            
            <Button 
              variant="ghost" 
              asChild 
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href={`/clubs/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to Club
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
