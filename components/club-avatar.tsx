import { stringToColor, getInitials } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface ClubAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hexagon?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
};

export function ClubAvatar({
  name,
  imageUrl,
  size = "md",
  className,
  hexagon = false,
}: ClubAvatarProps) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  const shapeClass = hexagon ? "clip-hexagon" : "rounded-xl";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "object-cover",
          shapeClass,
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold text-white",
        shapeClass,
        sizeClasses[size],
        className
      )}
      style={{ 
        backgroundColor: bgColor,
        fontFamily: "var(--font-display)",
      }}
    >
      {initials}
    </div>
  );
}
