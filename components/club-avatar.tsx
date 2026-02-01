import { stringToColor, getInitials } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface ClubAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-2xl",
};

export function ClubAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: ClubAvatarProps) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "rounded-lg object-cover",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg font-semibold text-white",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}
