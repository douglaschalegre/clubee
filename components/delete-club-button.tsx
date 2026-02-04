"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteClubButtonProps {
  clubId: string;
  clubName: string;
}

export function DeleteClubButton({ clubId, clubName }: DeleteClubButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const normalizedConfirm = confirmName.trim();
  const canDelete = normalizedConfirm === clubName;

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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setConfirmName("");
          setIsDeleting(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          Excluir clube
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            Excluir clube permanentemente
          </DialogTitle>
          <DialogDescription>
            Para confirmar, digite o nome do clube exatamente como aparece
            abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-amber/20 bg-amber/5 px-3 py-2 text-sm">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Nome do clube
            </span>
            <div className="mt-1 font-semibold text-foreground">
              {clubName}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="delete-club-name">
              Digite o nome para confirmar
            </label>
            <Input
              id="delete-club-name"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={clubName}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              className="border-amber/40 focus-visible:border-amber focus-visible:ring-amber/30"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Esta ação é irreversível e remove assinaturas e dados do clube.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir definitivamente"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
