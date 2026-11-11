---
name: cloudflare-deploy
description: Deploy a static site or small Worker to Cloudflare Workers with Wrangler, then verify it live. Use when publishing a site or app to Cloudflare, renaming or retiring a Worker, adding a custom domain to a Worker, or debugging a Cloudflare deployment. Not for moving a domain's DNS to Cloudflare; use cloudflare-dns-cutover for that.
---

# Cloudflare Deploy

## Goal

Ship a build to Cloudflare Workers with one repeatable command, and prove it
works at its public URL before calling it done.

## Preconditions

- Wrangler is a project devDependency (`npm i -D wrangler`), not a global, so
  the version is pinned with the repo.
- Auth: run `npx wrangler whoami`. If it reports an OAuth login, reuse it. Only
  run `wrangler login` when it reports no authentication. Never print tokens,
  account IDs, or account email addresses in logs, commits, or chat.
- Node: confirm `node -v` meets Wrangler's minimum before diagnosing anything
  else. A stale Node on `PATH` causes misleading errors.

## Choose The Shape

| Build output | Config |
|---|---|
| Plain static files (Astro, Vite, Eleventy, etc.) | Assets-only Worker: `assets.directory`, no `main` |
| Static files plus redirects, headers, or an API | `main` script plus an `assets` binding |
| Framework that emits a Worker (Next via an adapter, Remix, etc.) | Use the framework's generated `wrangler.json`; do not hand-edit generated output |

Prefer the simplest shape that works. A static site does not need server code.

## Minimal Configs

Assets only:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "example-com",            // no dots; becomes example-com.<subdomain>.workers.dev
  "compatibility_date": "YYYY-MM-DD",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

Assets plus a small Worker (for example, a `www` → apex redirect):

```jsonc
{
  "name": "example-com",
  "main": "worker/index.js",
  "compatibility_date": "YYYY-MM-DD",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page",
    "run_worker_first": true          // required, or matching static files bypass the script
  },
  "routes": [
    { "pattern": "example.com", "custom_domain": true },
    { "pattern": "www.example.com", "custom_domain": true }
  ],
  "workers_dev": false,              // keep true only while testing on the temporary URL
  "preview_urls": false
}
```

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.example.com') {
      url.hostname = 'example.com';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
```

Add `"deploy": "<build command> && wrangler deploy"` to `package.json` so one
command always builds before it ships.

## Deploy

1. Build and deploy: `CI=1 npm run deploy < /dev/null`. `CI=1` and the closed
   stdin stop Wrangler from waiting on interactive prompts.
2. If Wrangler asks to choose the account-wide `workers.dev` subdomain, stop and
   ask the owner. It is permanent and public.
3. Record the URL Wrangler prints. Do not guess it.

## Verify (Required)

Run these against the live URL, not the local preview:

- `/` returns 200 and the expected `<title>`.
- Every CSS, JS, and font URL referenced in the HTML returns 200 with the right
  content type.
- A missing path returns 404, not 200 with the homepage.
- With a custom domain: `https://` works on apex and `www`; `www` and `http://`
  301 to the canonical `https://` host; the certificate issuer is valid.
- Metadata: canonical URL, `og:image`, and description point at the production
  host. Expect `og:image` to fail until the custom domain is live.

## Renames And Retirement

- A Worker cannot be renamed. Deploy under the new `name`, verify it, then
  delete the old one with `wrangler delete --name <old> --force`.
- Deletion is permanent and drops the old URL. Get explicit owner approval
  first, and confirm the old URL returns 404 afterward.
- Before deleting, search other checkouts for configs that still target the old
  name; a stale config elsewhere can silently redeploy it.

## Gotchas

- Worker names cannot contain dots: use `example-com`, not `example.com`.
- Wrangler defaults `workers_dev` and `preview_urls` to on. Set both explicitly.
- Without `run_worker_first: true`, requests that match a static file never reach
  the script, so host-based redirects silently do nothing for `/`.
- Custom domains can be attached while the zone is still pending activation.
  They start serving once Cloudflare activates the zone.
- Wrangler's OAuth token can deploy Workers but cannot edit DNS records. DNS
  changes go through the dashboard or a scoped API token.
