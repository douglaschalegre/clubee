"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface JoinButtonProps {
  clubId: string;
}

export function JoinButton({ clubId }: JoinButtonProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setIsJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/join`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join club");
      }

      router.push(`/clubs/${clubId}/members`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}
      <Button onClick={handleJoin} disabled={isJoining} size="lg">
        {isJoining ? "Joining..." : "Join Club"}
      </Button>
    </div>
  );
}
