"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EventDeleteButtonProps {
  clubId: string;
  eventId: string;
  eventTitle: string;
  onDeleted?: () => void;
}

export function EventDeleteButton({ clubId, eventId, eventTitle, onDeleted }: EventDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao excluir evento");
      }

      setOpen(false);
      toast.success("Evento excluído!");
      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setConfirmation(""); } }}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Excluir evento"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir evento</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Digite{" "}
            <span className="font-semibold text-foreground">{eventTitle}</span>{" "}
            para confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={eventTitle}
          disabled={isDeleting}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting || confirmation !== eventTitle}
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
