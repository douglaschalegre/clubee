"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DeleteClubButtonProps {
  clubId: string;
  clubName: string;
}

export function DeleteClubButton({ clubId, clubName }: DeleteClubButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete club");
      }

      router.push("/clubs");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete club:", err);
      setIsDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
      >
        Delete Club
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <strong>{clubName}</strong>? This action
        cannot be undone.
      </p>
      <div className="flex gap-3">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Yes, Delete"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
