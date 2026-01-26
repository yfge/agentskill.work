const DEFAULT_SITE_ORIGIN = "https://www.agentskill.work";

export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_ORIGIN || DEFAULT_SITE_ORIGIN;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function absoluteUrl(pathname: string): string {
  const site = getSiteOrigin();
  if (!pathname.startsWith("/")) {
    return `${site}/${pathname}`;
  }
  return `${site}${pathname}`;
}
