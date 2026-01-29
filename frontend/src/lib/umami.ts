declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void;
    };
  }
}

export function trackEvent(
  event: string,
  data?: Record<string, string | number>,
): void {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(event, data);
  }
}

export function trackGitHubOutbound(repoFullName: string): void {
  trackEvent("github_outbound", { repo: repoFullName });
}

export function trackSearch(query: string): void {
  trackEvent("search", { query: query.slice(0, 100) });
}
