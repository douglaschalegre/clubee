/**
 * Generate a consistent HSL color from a string.
 * Uses a simple hash function to ensure the same string always produces the same color.
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate hue from hash (0-360)
  const hue = Math.abs(hash % 360);
  // Use consistent saturation and lightness for pleasant colors
  return `hsl(${hue}, 65%, 45%)`;
}

/**
 * Get initials from a name (up to 2 characters).
 */
export function getInitials(name: string): string {
  if (!name) return "?";

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
