# Tasks

- [x] Add skill detail page with SEO/GEO (metadata + JSON-LD)
- [x] Add skill detail API endpoint (by owner/repo)
- [x] Track per-skill PV/UV in Redis (no UI display)
- [x] Add skill detail URLs to sitemap (DB-driven, capped)
- [x] Add INTERNAL_API_URL for server-side fetches
- [x] Add GitHub API pagination
- [ ] Add GitHub rate-limit/backoff handling
- [ ] Add unit tests for GitHub sync (mock httpx responses)
- [ ] Store topics as array/JSON and add topic search filters
- [x] Add pagination in frontend UI
- [ ] Add sort controls in frontend UI
- [ ] Add API endpoint for sync status (last run, count, errors)
- [ ] Add optional background worker container for scheduled sync (split from API)
- [ ] Add CI workflow for lint/test on push
- [ ] Add production hardening docs (HTTPS, secrets rotation, DB backups)
- [ ] Upgrade Next.js to a patched release and re-run frontend lint/build
