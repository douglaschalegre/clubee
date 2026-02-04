"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email?: string;
}

interface TransferOwnershipProps {
  clubId: string;
  members: Member[];
}

export function TransferOwnership({ clubId, members }: TransferOwnershipProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  async function handleTransfer() {
    if (!selectedMemberId) return;

    setIsTransferring(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerUserId: selectedMemberId }),
      });

      const text = await res.text();
      if (!text) {
        throw new Error(`Resposta vazia do servidor (status: ${res.status})`);
      }

      let data: { error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta JSON inválida: ${text.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Falha ao transferir propriedade");
      }

      toast.success("Propriedade transferida!");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
      setIsTransferring(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transferir propriedade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Transferir propriedade do clube
          </DialogTitle>
          <DialogDescription>
            Escolha um membro para se tornar o novo organizador. Você perderá o acesso de administrador, mas continuará como membro. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="member">Novo organizador</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger id="member">
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {members.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum outro membro disponível
                  </div>
                ) : (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} {member.email && `(${member.email})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isTransferring}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleTransfer}
            disabled={!selectedMemberId || isTransferring}
          >
            {isTransferring ? "Transferindo..." : "Confirmar transferência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
