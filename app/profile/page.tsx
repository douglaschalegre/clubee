import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { findOrCreateUser } from "@/lib/user";
import { ProfileForm } from "@/components/profile-form";
import { UserRound } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { returnTo } = await searchParams;
  const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : "/profile";

  const dbUser = await findOrCreateUser({
    sub: session.user.sub,
    name: session.user.name,
    email: session.user.email,
    picture: session.user.picture,
  });

  const isCompleted = dbUser.profileCompleted;
  const title = isCompleted ? "Seu perfil" : "Complete seu perfil";
  const description = isCompleted
    ? "Atualize suas informações pessoais quando quiser."
    : "Precisamos do seu nome para exibir na lista de membros.";

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <UserRound className="h-8 w-8 text-primary" />
        </div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <ProfileForm
          email={dbUser.email}
          initialName={dbUser.name}
          initialPhone={dbUser.phone}
          isCompleted={isCompleted}
          returnTo={safeReturnTo}
        />
      </div>
    </div>
  );
}
