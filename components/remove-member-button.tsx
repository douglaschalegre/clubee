"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface RemoveMemberButtonProps {
  clubId: string;
  userId: string;
  memberName: string;
}

export function RemoveMemberButton({
  clubId,
  userId,
  memberName,
}: RemoveMemberButtonProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    if (
      !confirm(
        `Remove ${memberName} from the club? Their membership will be deleted.`
      )
    ) {
      return;
    }

    setIsRemoving(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
      setIsRemoving(false);
    }
  }

  return (
    <Button
      onClick={handleRemove}
      disabled={isRemoving}
      variant="ghost"
      size="icon-sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      title="Remove member"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
