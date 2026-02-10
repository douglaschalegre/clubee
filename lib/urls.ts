export function getAppBaseUrl(): string {
  const baseUrl = process.env.APP_BASE_URL?.trim();
  const normalized = baseUrl?.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    if (!normalized) {
      throw new Error("APP_BASE_URL is required in production");
    }
    if (!normalized.startsWith("https://")) {
      throw new Error("APP_BASE_URL must use https in production");
    }
    return normalized;
  }

  return normalized || "http://localhost:3000";
}
