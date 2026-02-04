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
        <Button
          variant="outline"
          className="w-full justify-between border-amber/40 text-foreground hover:bg-amber/10 hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transferir propriedade
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl border-0 bg-transparent p-0 shadow-none">
        <div className="relative overflow-hidden rounded-2xl border bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.98_0.02_95/0.6)_0%,_transparent_65%)] opacity-60" />
          <div className="pointer-events-none absolute inset-0 pattern-honeycomb opacity-20" />
          <div className="relative grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
            <div className="relative border-b border-amber/20 bg-amber/5 p-6 md:border-b-0 md:border-r">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                Ação crítica
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Risco e impactos
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta mudança transfere o controle administrativo do clube.
              </p>
              <ul className="stagger-in mt-4 space-y-3 text-sm text-foreground/80">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber/60" />
                  Você perde acesso de administrador imediatamente.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber/60" />
                  O novo organizador controla pagamentos e configurações.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber/60" />
                  Esta ação não pode ser desfeita.
                </li>
              </ul>
            </div>
            <div className="p-6">
              <DialogHeader className="text-left sm:text-left">
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <ArrowRightLeft className="h-5 w-5 text-amber-700" />
                  Transferir propriedade do clube
                </DialogTitle>
                <DialogDescription>
                  Escolha um membro para assumir como organizador. Você continua
                  como membro após a transferência.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="member">Novo organizador</Label>
                  <p className="text-xs text-muted-foreground">
                    Apenas membros com Stripe conectado aparecem na lista.
                  </p>
                  <Select
                    value={selectedMemberId}
                    onValueChange={setSelectedMemberId}
                  >
                    <SelectTrigger id="member">
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Nenhum membro com Stripe conectado disponível
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

              <DialogFooter className="gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isTransferring}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleTransfer}
                  disabled={!selectedMemberId || isTransferring}
                  className="w-full sm:w-auto"
                >
                  {isTransferring
                    ? "Transferindo..."
                    : "Confirmar transferência"}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
