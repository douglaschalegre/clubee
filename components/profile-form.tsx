"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserRound } from "lucide-react";

interface ProfileFormProps {
  email: string;
  returnTo: string;
}

export function ProfileForm({ email, returnTo }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao atualizar perfil");
      }

      toast.success("Perfil atualizado!");
      router.push(returnTo || "/my-clubs");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Seu nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome completo"
          required
          maxLength={80}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Esse nome aparece na lista de membros e em todos os clubes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          value={email}
          readOnly
          className="h-11 bg-muted/40"
        />
        <p className="text-xs text-muted-foreground">
          Este é o email usado para entrar no Clubee.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full gap-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserRound className="h-4 w-4" />
        )}
        {isSubmitting ? "Salvando..." : "Salvar e continuar"}
      </Button>
    </form>
  );
}
