import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ClubCard } from "@/components/club-card";
import { Plus, Sparkles } from "lucide-react";

export default async function ClubsPage() {
  const session = await auth0.getSession();

  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  });

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-10">
        {/* Background decoration */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-amber/10 blur-3xl" />
        
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Community Awaits</span>
            </div>
            <h1 
              className="text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Discover Clubs
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Find your tribe. Join communities that match your passions and interests.
            </p>
          </div>
          
          {session && (
            <Button 
              asChild 
              size="lg"
              className="group shrink-0 gap-2 shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.02]"
            >
              <Link href="/clubs/new">
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Create Club
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Clubs Grid */}
      {clubs.length === 0 ? (
        <section className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border/60 p-12 text-center">
          <div className="absolute inset-0 pattern-honeycomb opacity-30" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <span className="text-3xl">🍯</span>
            </div>
            <h2 
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              No clubs yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              {session
                ? "Be the first to create a club and start building your community!"
                : "Sign up to create the first club and start something amazing."}
            </p>
            {session && (
              <Button asChild className="mt-6 shadow-honey">
                <Link href="/clubs/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Club
                </Link>
              </Button>
            )}
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {clubs.length} {clubs.length === 1 ? "club" : "clubs"} available
            </p>
          </div>
          
          <div className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                id={club.id}
                name={club.name}
                description={club.description}
                imageUrl={club.imageUrl}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
