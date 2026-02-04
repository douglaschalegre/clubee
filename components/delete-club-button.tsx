"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeleteClubButtonProps {
  clubId: string;
  clubName: string;
}

export function DeleteClubButton({ clubId, clubName }: DeleteClubButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao excluir o clube");
      }

      toast.success("Clube excluído!");
      router.push("/clubs");
      router.refresh();
    } catch (err) {
      toast.error("Falha ao excluir o clube");
      setIsDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
      >
        Excluir clube
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tem certeza de que deseja excluir <strong>{clubName}</strong>? Esta ação
        não pode ser desfeita.
      </p>
      <div className="flex gap-3">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Excluindo..." : "Sim, excluir"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
