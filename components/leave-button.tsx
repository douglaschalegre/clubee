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

interface LeaveButtonProps {
  clubId: string;
}

export function LeaveButton({ clubId }: LeaveButtonProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleLeave() {
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
      setOpen(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={isLeaving}>
            {isLeaving ? "Leaving..." : "Leave Club"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this club?</AlertDialogTitle>
            <AlertDialogDescription>
              Your membership will be canceled and you will lose access to club
              content. You can rejoin later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLeaving}
              variant="destructive"
            >
              {isLeaving ? "Leaving..." : "Leave Club"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
