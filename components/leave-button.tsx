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
      {error && (
        <div className="mb-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={isLeaving} className="gap-2">
            <LogOut className="h-4 w-4" />
            {isLeaving ? "Leaving..." : "Leave Club"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle 
              className="text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Leave this club?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Your membership will be canceled and you will lose access to club
              content. You can rejoin later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isLeaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLeaving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Leaving...
                </>
              ) : (
                "Leave Club"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
