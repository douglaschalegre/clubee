import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ClubCard } from "@/components/club-card";

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
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clubs</h1>
          <p className="mt-1 text-muted-foreground">
            Discover and join clubs for your interests.
          </p>
        </div>
        {session && (
          <Button asChild>
            <Link href="/clubs/new">Create Club</Link>
          </Button>
        )}
      </div>

      {/* Clubs Grid */}
      {clubs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-medium">No clubs yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {session
              ? "Be the first to create a club!"
              : "Sign up to create the first club."}
          </p>
          {session && (
            <Button asChild className="mt-4">
              <Link href="/clubs/new">Create Club</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
}
