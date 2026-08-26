# Infrastructure Runbook

How the Vand Technologies stack is wired end to end — domains, edge, hosting, API, storage
and mail — and the exact procedures for changing any of it without breaking search or media.

**Last verified:** 26 Aug 2026 · **Products:** Tugezo · Admin · Vand · **Registrar & DNS:** Cloudflare

---

## Contents

- [1. Stack at a glance](#1-stack-at-a-glance)
- [2. Request paths](#2-request-paths)
- [3. Domains & DNS](#3-domains--dns)
- [4. Hosting & apps](#4-hosting--apps)
- [5. API server](#5-api-server)
- [6. Storage & media](#6-storage--media)
- [7. Mail & DNS authentication](#7-mail--dns-authentication)
- [8. Environment](#8-environment)
- [9. Procedure — deploy](#9-procedure--deploy)
- [10. Procedure — add a domain](#10-procedure--add-a-domain-to-a-vercel-app)
- [11. Procedure — migrate to a new domain](#11-procedure--migrate-to-a-new-domain)
- [12. Procedure — rebrand](#12-procedure--rebrand)
- [13. Hard-won gotchas](#13-hard-won-gotchas)
- [14. Health checks](#14-health-checks)

---

## 1. Stack at a glance

| Layer | Provider | What runs there |
|---|---|---|
| Registrar & DNS | Cloudflare | Zones `vand.rw` and `tugezo.com` |
| Edge / CDN | Cloudflare + Vercel | Proxied for `vand.rw`; DNS-only for `tugezo.com` |
| Web hosting | Vercel | Tugezo, Admin, Vand — separate projects, one repo |
| API | DigitalOcean | nginx 1.24 (Ubuntu) → app, at `159.89.97.208` |
| Object storage | Cloudflare R2 | Bucket `vandmedia` via `storage.vand.rw` |
| Transactional mail | Brevo | DKIM-signed sending for `vand.rw` |
| Inbound mail | Cloudflare Email Routing | MX on `vand.rw`, forwards to real inboxes |
| Search | Google Search Console | Properties for `tugezo.com` and `menyesha.vand.rw` |

### Monorepo

Nx `22.5.1` with npm workspaces (`packages/*`, `apps/*`).
No pnpm — the lockfile is `package-lock.json`.

**Apps**

| Project | Path | Role |
|---|---|---|
| `@org/tugezo` | `apps/tugezo` | Public site (tugezo.com) |
| `@org/admin` | `apps/admin` | Admin console |
| `@org/vand` | `apps/vand` | Company site |

**Shared packages**

| Package | Contents |
|---|---|
| `@org/api` | axios client + typed services |
| `@org/i18n` | next-intl config, locales (en/fr/rw) |
| `@org/ui` | ThemeProvider, `cn()`, `SocialIcons`, `SOCIAL_LINKS` |

**Runtime versions**

| Package | Version | Package | Version |
|---|---|---|---|
| Next.js | `~16.0.1` | Tailwind CSS | `^4` |
| React | `^19.0.0` | next-intl | `^4.3.1` |
| TypeScript | `~5.9.2` | TanStack Query | `^5.90.21` |
| Nx | `22.5.1` | axios | `^1.13.6` |

---

## 2. Request paths

### Page request — `tugezo.com`

1. **Browser** resolves `tugezo.com` → `CNAME cafc831d8a529b34.vercel-dns-017.com` (flattened by Cloudflare)
2. **Cloudflare** answers DNS only — **not** proxied. Vercel provides CDN, DDoS and TLS itself
3. **Vercel** serves the Next.js app from `apps/tugezo` (SSR / ISR, edge OG images)
4. **Browser** fetches data from `api.vand.rw` with a Bearer token from `localStorage`

### API request — `api.vand.rw`

1. **Browser** resolves via wildcard `*.vand.rw` → `A 159.89.97.208`, proxied
2. **Cloudflare** proxies — origin IP hidden, DDoS absorbed, TLS terminated
3. **nginx** routes by `server_name` to the API app. Routes are namespaced per product: `/api/tugezo/*`

> **Why the asymmetry?** Vercel already provides CDN, DDoS mitigation and certificates, so proxying
> in front of it adds a hop and disables Vercel's own bot tooling — hence **DNS-only** there.
> The API is a bare droplet with a public IP, so Cloudflare's proxy is genuinely valuable —
> hence **proxied**.

---

## 3. Domains & DNS

### Zone: `tugezo.com`

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` | `cafc831d8a529b34.vercel-dns-017.com` | DNS only |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only |

A `CNAME` at the apex is only legal because of Cloudflare's **CNAME flattening**.
`dig A tugezo.com` still returns IPs — expected, not a fault.

### Zone: `vand.rw` — infrastructure records

| Type | Name | Value | Proxy | Purpose |
|---|---|---|---|---|
| A | `api` | `159.89.97.208` | Proxied | API origin |
| A | `*` | `64.29.17.65`, `216.198.79.1` | Proxied | Wildcard — covers `menyesha` |
| A | `@`, `www` | `216.198.79.1`, `64.29.17.x` | Proxied | Company site (Vercel) |
| R2 | `storage` | `vandmedia` | Proxied | Media bucket |
| MX | `@` ×3 | `route1/2/3.mx.cloudflare.net` | — | Email Routing |
| CAA | `@` | `letsencrypt.org`, `pki.goog`, `sectigo.com` | — | Restricts cert issuers |

> ⚠️ **Wildcard consequence.** There is **no explicit `menyesha` record** — it resolves through
> `*.vand.rw`. You cannot unproxy that one hostname without adding a specific record to override
> the wildcard, and turning the wildcard off would unproxy *every* subdomain. This is why Vercel's
> "Proxy Detected" notice on `menyesha.vand.rw` is deliberately left alone.

### Redirect topology

One canonical host. Every other entry point reaches it in **a single hop**, path preserved.

| Hostname | Behaviour | Status |
|---|---|---|
| `tugezo.com` | Serves the site — canonical | `200` |
| `www.tugezo.com` | → `tugezo.com`, path preserved | `308` |
| `menyesha.vand.rw` | → `tugezo.com`, path preserved | `308` |

Keep the `menyesha.vand.rw` redirect **indefinitely** — old links persist in shares and on other
sites long after Google has moved on.

---

## 4. Hosting & apps

### Vercel project settings that matter

| Setting | Value | Note |
|---|---|---|
| Root Directory | `apps/tugezo` | **Must track folder renames** |
| Include files outside root | On | Required — apps import `packages/*` |
| Build command | default (`next build`) | Or `npx nx build @org/tugezo` |
| Framework | Next.js | Output directory auto |

### Local commands

```bash
npx nx dev @org/tugezo        # dev server
npx nx build @org/tugezo      # production build
npx nx run-many --target=build --projects=@org/tugezo,@org/admin
npx nx reset                  # clear Nx cache + daemon
npx nx show projects          # confirm project registration
```

`next.config.ts` tries `@nx/next` and falls back to a plain Next build if absent. That is what
lets Vercel build a single app from a scoped install without the whole Nx toolchain.

---

## 5. API server

| Property | Value |
|---|---|
| Public hostname | `api.vand.rw` |
| Origin IP | `159.89.97.208` |
| Web server | `nginx/1.24.0 (Ubuntu)` |
| Route namespace | `/api/tugezo/*` |
| Auth | Bearer token in `localStorage` |
| Client | `packages/api/src/client.ts` (axios) |

**Auth flow.** A request interceptor attaches `Authorization: Bearer <token>` from `localStorage`.
A response interceptor catches `401 · "Token has expired"`, clears the stored token and redirects
to `/login`. There are no auth cookies — so the API host does **not** need to be same-site with
the web app.

> **Design note.** API routes are namespaced per product (`/api/tugezo/*`), which is why the API
> lives on the **company** domain rather than the product's. Shared infrastructure stays with Vand;
> only user-facing brand assets follow the product.

### Adding a hostname to the API

1. Cloudflare → target zone → **A** record → `159.89.97.208`, **Proxied**
2. On the droplet, add it to nginx and keep the old one:
   ```nginx
   server_name api.vand.rw api.tugezo.com;
   ```
3. Extend the certificate — required if the zone uses *Full (strict)*:
   ```bash
   sudo certbot --nginx -d api.vand.rw -d api.tugezo.com
   ```
4. Add the new web origin to the backend's **CORS allow-list**
5. Only then update `NEXT_PUBLIC_API_URL` and redeploy

---

## 6. Storage & media

Cloudflare R2 bucket `vandmedia`, served publicly from `storage.vand.rw`.

> 🛑 **Do not rename.** Image URLs are stored **absolute in the database**. Changing the R2 custom
> domain does not rewrite those rows — every existing article image, crest and player photo would
> 404. If a new hostname is ever needed, **add** it as a second R2 custom domain and keep
> `storage.vand.rw` serving forever. R2 supports multiple custom domains per bucket.

### Where the media host is configured

| File | Setting |
|---|---|
| `apps/tugezo/next.config.ts` | `images.remotePatterns` → `storage.vand.rw`, `*.r2.dev` |
| `apps/admin/next.config.ts` | same |
| `apps/tugezo/src/lib/brand.ts` | `MEDIA_HOST_SUFFIX = '.vand.rw'` |
| `…/app/api/media-proxy/route.ts` | `ALLOWED_SUFFIXES` host allow-list |

### Why a media proxy exists

Share graphics are rasterised in the browser with `html-to-image`. A cross-origin image taints the
canvas and blanks the export, so covers are fetched through the same-origin route
`/api/media-proxy` and inlined as data URLs. The route is host-allow-listed, capped at 8 MB and
restricted to image content types.

> **Deliberate separation.** `MEDIA_HOST_SUFFIX` is intentionally **not** derived from the site
> domain. Media still comes from `vand.rw` while the site lives on `tugezo.com` — coupling them
> would have silently broken every cover image at rebrand.

---

## 7. Mail & DNS authentication

Inbound via Cloudflare Email Routing; outbound signed by Brevo. All records live on `vand.rw`.

| Record | Name | Purpose |
|---|---|---|
| MX | `@` ×3 | Cloudflare Email Routing — forwards to real inboxes |
| TXT | `@` (SPF) | `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all` |
| TXT | `_dmarc` | `p=none` with `rua` reporting to Cloudflare |
| TXT | `cf2024-1._domainkey` | Cloudflare DKIM |
| CNAME | `brevo1/2._domainkey` | Brevo DKIM for transactional mail |
| TXT | `@` (brevo-code) | Brevo domain ownership |

> **Open item.** `tugezo.com` has **no MX record**, so `@tugezo.com` mail does not exist yet.
> Until it does, `CONTACT_EMAIL` in `brand.ts` deliberately still points at the working `vand.rw`
> address — changing it first would break every contact link on the site. Cloudflare Email Routing
> is already proven on `vand.rw`; repeat it on the new zone, then flip the constant.

Raising DMARC to `p=quarantine` is worth doing once the `rua` reports show clean alignment for
both Cloudflare and Brevo sources.

---

## 8. Environment

Every variable is `NEXT_PUBLIC_*` except the proxy allow-list, meaning they ship to the browser.
**Never put secrets here.**

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | tugezo, admin | axios `baseURL` |
| `NEXT_PUBLIC_SITE_URL` | tugezo | Canonicals, hreflang, sitemap, share links |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | tugezo | Renders the GSC meta tag |
| `NEXT_PUBLIC_GA_ID` | tugezo | Analytics |
| `IMAGE_PROXY_HOSTS` | tugezo, admin | Server-only; extra allowed media hosts, comma-separated |

> **Guard rail.** `NEXT_PUBLIC_SITE_URL` is only trusted when it starts with `https://`. A localhost
> value is ignored in favour of the production fallback, so a dev machine can never leak
> `localhost` into canonicals or the sitemap.

### `brand.ts` — the single lever

`apps/tugezo/src/lib/brand.ts` is imported by ~36 files and is the only place brand or domain
strings live. There are no hardcoded brand literals anywhere else in the app.

| Constant | Drives |
|---|---|
| `SITE_URL` / `SITE_HOST` | Canonicals, hreflang, sitemap, robots, OG |
| `BRAND_DOMAIN` | What downloadable graphics print — *separate on purpose* |
| `BRAND_NAME` / `BRAND_TAGLINE` | Titles, OG, alt text, footer |
| `CONTACT_EMAIL` | Contact, about, privacy, terms, advertise |
| `MEDIA_HOST_SUFFIX` | Media-proxy allow-list |
| `LOGO_*_PATH` / `OG_IMAGE_PATH` | `/public` asset filenames |

`BRAND_DOMAIN` is split from `SITE_URL` because graphics are permanent once posted to social,
while canonicals must always name the host that actually answers `200`.

---

## 9. Procedure — deploy

1. Build locally first — Vercel failures are slower to diagnose:
   ```bash
   npx nx run-many --target=build --projects=@org/tugezo,@org/admin
   ```
2. Push to `main`. Vercel builds each project from its own Root Directory.
3. If the build fails on project resolution, run `npx nx reset` locally and confirm
   `npx nx show projects` lists what you expect.

---

## 10. Procedure — add a domain to a Vercel app

1. **Vercel first.** Project → Settings → Domains → add the hostname. Vercel shows the exact DNS
   values — use those, not remembered ones.
2. **Cloudflare DNS** → add the record → set **DNS only (grey)**. Proxying blocks Vercel's
   certificate issuance.
3. Wait for Vercel to report **Valid Configuration**. Certificate issuance is usually under a minute.
4. Pick a canonical host and redirect the other — apex or `www`, but only one serves `200`.

> **Vercel constraint.** A domain cannot be both a redirect *target* and a redirect *source*.
> To flip an existing arrangement, first repoint whatever aims at the domain, which frees it to
> become a redirect itself.

---

## 11. Procedure — migrate to a new domain

**The order is the whole procedure.** Doing step 3 before step 2 tells Google to ignore the new domain.

1. **Serve the new domain.** Add it in Vercel, add DNS, confirm it returns `200`.
   Old domain still live and unchanged.
2. **Flip the canonical.** Set `NEXT_PUBLIC_SITE_URL` and `FALLBACK_SITE_URL` to the new origin,
   deploy, then verify:
   ```bash
   curl -s https://new.example/rw/football \
     | grep -o '<link rel="canonical" href="[^"]*"'
   ```
   It must name the new domain before you continue.
3. **Redirect the old domain** — permanent `308`, path preserved. Verify a deep URL, not the homepage:
   ```bash
   curl -sI https://old.example/rw/football | grep -i location
   # must be https://new.example/rw/football
   ```
4. **Search Console.** Verify the new property, then run *Change of Address* **from the old
   property**. Submit the sitemap as a full URL on a Domain property.
5. **Leave it alone.** Expect a 2–8 week dip. Keep both GSC properties and the redirect permanently.

### Never

- Collapse all old URLs to the new homepage — this is what actually destroys rankings
- Delete the old GSC property; it is where the move is tracked
- Remove the old domain from hosting; every indexed URL dies instantly
- Stage subdomain → root later; that is two dips instead of one

---

## 12. Procedure — rebrand

Performed once already: **Menyesha → Tugezo, August 2026.**

1. **Config** — edit `brand.ts`: name, tagline, email, asset paths, `BRAND_DOMAIN`
2. **Assets** — new wordmark SVGs and OG image in `/public`; delete the superseded files and grep
   for references to them
3. **Copy** — `messages/{en,rw,fr}.json`. Edit as parsed JSON and verify all three keep identical
   key sets
4. **Admin** — its own `brand.ts` holds a base64-inlined wordmark for graphics; regenerate it
5. **Folder / project rename** (optional) — `git mv`, update Root Directory in Vercel, `tsconfig`
   references, then `npm install` and `npx nx reset`

> **Leave behind.** Social account URLs and the media host are *not* brand strings — accounts keep
> their real handles until renamed by hand, and media stays on `vand.rw`. API route namespaces
> change only when the backend actually changes them.

---

## 13. Hard-won gotchas

Each of these cost real debugging time. They are not hypothetical.

| Symptom | Cause & fix |
|---|---|
| `Failed to process project graph` | Stale Nx graph after moving/deleting a project folder → `npx nx reset` |
| `Waiting for … in another nx process` | Orphaned `nx dev` processes holding the task lock → kill them, then `nx reset` |
| Root Directory does not exist | Folder renamed in the repo but not in Vercel settings |
| Canonical points at a redirect | `SITE_URL` names a host that 3xx's — it must always be the `200` host |
| Cover image missing from exported PNG | Browser rasterised before decode → await `img.decode()` and render warm-up passes |
| Emoji missing from exported PNG | Colour emoji do not rasterise in `html-to-image` → use inline SVG |
| Whole exported PNG blank | Cross-origin image tainted the canvas → route through `/api/media-proxy` |
| Cache-busting breaks graphics | A query string appended to a `data:` URI corrupts it → never enable `cacheBust` |
| React #418 hydration mismatch | Timezone-dependent date rendered on the server → render empty, fill in on mount |
| Pages indexed but empty | Client-only rendering → seed `useQuery` with server-fetched `initialData` |
| GSC "Couldn't fetch" on a new sitemap | Usually just queued; validate the XML, then wait a few days |
| Sitemap path rejected | A **Domain** property needs the full URL, not a relative path |
| Redirect loop behind Cloudflare | SSL mode *Flexible* in front of an HTTPS origin → use *Full (strict)* |

---

## 14. Health checks

Run the **redirect** and **canonical** checks after *any* domain, Vercel or DNS change — those two
catch most silent SEO regressions.

### Redirect topology

```bash
for u in https://tugezo.com/rw/football \
         https://www.tugezo.com/rw/football \
         https://menyesha.vand.rw/rw/football; do
  printf "%-42s %s\n" "$u" \
    "$(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' "$u")"
done
# expect: 200 / 308 -> apex / 308 -> apex
```

### Canonical matches the serving host

```bash
curl -s https://tugezo.com/rw/football \
  | grep -o '<link rel="canonical" href="[^"]*"'
```

### Sitemap is valid and on-domain

```bash
curl -s -o /dev/null -w 'HTTP %{http_code} %{content_type}\n' https://tugezo.com/sitemap.xml
curl -s https://tugezo.com/sitemap.xml | grep -c "<loc>"
```

### API reachable and CORS-clean

```bash
curl -sI "https://api.vand.rw/api/tugezo/categories?language=en" \
  | grep -iE "^HTTP|^access-control"
```

### DNS resolves as expected

```bash
dig +short A tugezo.com          # flattened Vercel IPs
dig +short CNAME www.tugezo.com
```
