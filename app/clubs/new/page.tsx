import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { ClubForm } from "@/components/club-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { Sparkles } from "lucide-react";

export default async function NewClubPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto max-w-xl">
      <Breadcrumb
        items={[
          { label: "Clubes", href: "/clubs" },
          { label: "Criar" },
        ]}
      />
      
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Criar um clube
        </h1>
        <p className="mt-2 text-muted-foreground">
          Comece a construir sua comunidade. Você será o organizador.
        </p>
      </div>
      
      {/* Form Card */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <ClubForm mode="create" />
      </div>
    </div>
  );
}
