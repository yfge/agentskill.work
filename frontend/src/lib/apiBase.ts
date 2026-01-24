export function getApiBase(): string {
  const publicBase = process.env.NEXT_PUBLIC_API_URL || "/api";
  if (typeof window !== "undefined") {
    return publicBase;
  }

  const internalBase = process.env.INTERNAL_API_URL;
  if (internalBase) {
    return internalBase;
  }

  if (publicBase.startsWith("http")) {
    return publicBase;
  }

  return "http://localhost:8000";
}
