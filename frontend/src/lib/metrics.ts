const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

function getBase() {
  return API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
}

export async function trackVisit(visitorId: string): Promise<void> {
  const url = `${getBase()}/metrics/track`;
  await fetch(url, {
    method: "POST",
    headers: {
      "X-Visitor-Id": visitorId,
    },
  });
}

export async function fetchMetrics(): Promise<{ pv: number; uv: number }> {
  const url = `${getBase()}/metrics`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("failed");
  }
  return res.json();
}
