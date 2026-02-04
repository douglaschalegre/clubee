"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManageSubscriptionButtonProps {
  membershipId: string;
}

export function ManageSubscriptionButton({
  membershipId,
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao abrir o portal de cobrança");
      }

      if (!data.url) {
        throw new Error("Nenhuma URL de portal retornada");
      }

      window.location.href = data.url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao abrir o portal"
      );
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        disabled={isLoading}
        onClick={handleClick}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Abrindo portal...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Gerenciar assinatura
          </>
        )}
      </Button>
    </div>
  );
}
