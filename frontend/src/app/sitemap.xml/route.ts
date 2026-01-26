import { absoluteUrl } from "@/lib/site";

export function GET() {
  return Response.redirect(absoluteUrl("/sitemap-index.xml"), 308);
}
