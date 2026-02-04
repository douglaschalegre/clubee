"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LeaveButtonProps {
  clubId: string;
}

export function LeaveButton({ clubId }: LeaveButtonProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleLeave() {
    setIsLeaving(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao sair do clube");
      }

      const data = await res.json();
      if (data.warning) {
        console.warn(data.warning);
      }

      window.location.href = `/clubs/${clubId}`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
      setIsLeaving(false);
      setOpen(false);
    }
  }

  return (
    <div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={isLeaving} className="gap-2">
            <LogOut className="h-4 w-4" />
            {isLeaving ? "Saindo..." : "Sair do clube"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle 
              className="text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sair deste clube?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Sua assinatura será cancelada e você perderá acesso ao conteúdo do
              clube. Você pode entrar novamente depois, se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isLeaving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLeaving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saindo...
                </>
              ) : (
                "Sair do clube"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
