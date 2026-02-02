"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface JoinButtonProps {
  clubId: string;
}

export function JoinButton({ clubId }: JoinButtonProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setIsJoining(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clubId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsJoining(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}
      <Button onClick={handleJoin} disabled={isJoining} size="lg" className="w-full">
        {isJoining ? "Redirecting to payment..." : "Join Club - Subscribe"}
      </Button>
    </div>
  );
}
