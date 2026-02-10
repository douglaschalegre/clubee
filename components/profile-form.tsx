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
  initialName: string;
  initialPhone: string | null;
  isCompleted: boolean;
  returnTo: string;
}

export function ProfileForm({
  email,
  initialName,
  initialPhone,
  isCompleted,
  returnTo,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const normalizedPhone = phone.trim();
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: normalizedPhone.length > 0 ? normalizedPhone : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao atualizar perfil");
      }

      toast.success("Perfil atualizado!");
      router.push(returnTo || "/profile");
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
        <Label htmlFor="phone" className="text-sm font-medium">
          Telefone
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="(00) 00000-0000"
          maxLength={30}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Usado para comunicação interna do clube.
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
        {isSubmitting
          ? "Salvando..."
          : isCompleted
            ? "Salvar alterações"
            : "Salvar e continuar"}
      </Button>
    </form>
  );
}
