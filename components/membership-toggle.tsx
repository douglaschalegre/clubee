"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MembershipToggleProps {
  clubId: string;
  userId: string;
  currentStatus: "active" | "inactive";
}

export function MembershipToggle({
  clubId,
  userId,
  currentStatus,
}: MembershipToggleProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  async function handleToggle() {
    setIsUpdating(true);

    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const res = await fetch(
        `/api/clubs/${clubId}/members/${userId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao atualizar o status");
      }

      router.refresh();
    } catch (err) {
      console.error("Falha ao alternar o status:", err);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isUpdating}
      className="text-xs"
    >
      {isUpdating
        ? "..."
        : currentStatus === "active"
          ? "Definir inativo"
          : "Definir ativo"}
    </Button>
  );
}
