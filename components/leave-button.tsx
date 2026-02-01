"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

interface LeaveButtonProps {
  clubId: string;
}

export function LeaveButton({ clubId }: LeaveButtonProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirm("Leave this club? Your membership will be canceled.")) {
      return;
    }

    setIsLeaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave club");
      }

      const data = await res.json();
      if (data.warning) {
        console.warn(data.warning);
      }

      window.location.href = `/clubs/${clubId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLeaving(false);
    }
  }

  return (
    <form
      action={`/api/clubs/${clubId}/leave`}
      method="post"
      onSubmit={handleLeave}
    >
      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}
      <Button
        type="submit"
        disabled={isLeaving}
        variant="outline"
      >
        {isLeaving ? "Leaving..." : "Leave Club"}
      </Button>
    </form>
  );
}
