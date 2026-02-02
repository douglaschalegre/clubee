"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft, Image } from "lucide-react";

interface ClubFormProps {
  mode: "create" | "edit";
  initialData?: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
  };
  clubId?: string;
}

export function ClubForm({ mode, initialData, clubId }: ClubFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === "create" ? "/api/clubs" : `/api/clubs/${clubId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
          throw new Error(data.error || "Algo deu errado");
      }

      const data = await res.json();
      router.push(`/clubs/${data.club.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nome do clube <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Meu clube incrível"
          required
          maxLength={100}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Descrição
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Sobre o que é seu clube? Compartilhe sua missão e o que os membros podem esperar..."
          maxLength={500}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 caracteres
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="text-sm font-medium flex items-center gap-2">
          <Image className="h-4 w-4 text-muted-foreground" />
          URL da imagem
        </Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Deixe em branco para usar um avatar gerado com base no nome do clube.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="gap-2 shadow-honey transition-all hover:shadow-honey-lg sm:flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
               {mode === "create" ? "Criando..." : "Salvando..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
               {mode === "create" ? "Criar clube" : "Salvar alterações"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
