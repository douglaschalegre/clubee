import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { ClubForm } from "@/components/club-form";

export default async function NewClubPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Create a Club</h1>
      <ClubForm mode="create" />
    </div>
  );
}
