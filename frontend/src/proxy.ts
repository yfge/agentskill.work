import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Lang = "en" | "zh";

const LANG_HEADER = "x-agentskill-lang";

function langFromPathname(pathname: string): Lang | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en";
  }
  if (pathname === "/zh" || pathname.startsWith("/zh/")) {
    return "zh";
  }
  return null;
}

function langFromAcceptLanguage(value: string | null | undefined): Lang {
  if (!value) {
    return "zh";
  }

  let best: { lang: Lang; q: number; index: number } | null = null;
  const parts = value.split(",");

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]?.trim();
    if (!part) {
      continue;
    }

    const [rangeRaw, ...params] = part.split(";");
    const range = rangeRaw?.trim().toLowerCase();
    if (!range) {
      continue;
    }

    let lang: Lang | null = null;
    if (range.startsWith("zh")) {
      lang = "zh";
    } else if (range.startsWith("en")) {
      lang = "en";
    } else {
      continue;
    }

    let q = 1;
    for (const param of params) {
      const [key, rawValue] = param.trim().split("=");
      if (key === "q" && rawValue) {
        const parsed = Number.parseFloat(rawValue);
        if (!Number.isNaN(parsed)) {
          q = parsed;
        }
      }
    }

    if (!best || q > best.q || (q === best.q && index < best.index)) {
      best = { lang, q, index };
    }
  }

  return best?.lang ?? "en";
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const lang =
    langFromPathname(pathname) ??
    langFromAcceptLanguage(request.headers.get("accept-language"));

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LANG_HEADER, lang);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
