"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface EventDeleteButtonProps {
  clubId: string;
  eventId: string;
  eventTitle: string;
}

export function EventDeleteButton({ clubId, eventId, eventTitle }: EventDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Excluir o evento \"${eventTitle}\"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao excluir evento");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Algo deu errado");
      setIsDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Excluir evento"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
