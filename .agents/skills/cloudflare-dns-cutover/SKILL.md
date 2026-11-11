---
name: cloudflare-dns-cutover
description: Move a domain's authoritative DNS from another registrar (GoDaddy, Namecheap, etc.) to Cloudflare without breaking email or other services, then point it at a Cloudflare Worker. Use when connecting a custom domain to Cloudflare, changing nameservers, auditing DNS before a migration, or setting up no-email protection records. Deploying the site itself is covered by cloudflare-deploy.
---

# Cloudflare DNS Cutover

## Goal

Make Cloudflare authoritative for a domain while the registrar stays where it
is, with every record that matters carried over, a working rollback, and proof
that the site and any mail still work afterward.

## Authority Boundary

Every step that changes a live account needs explicit owner approval: adding
the zone, editing records, changing nameservers, and toggling zone settings.
Reading DNS with `dig` needs none. Never enter credentials; the owner signs in.

## 1. Snapshot Before Touching Anything

- Public view: `dig +short` for `NS`, `SOA`, `A`, `AAAA`, `MX`, `TXT`, `CAA` on
  the apex, plus `www`, `_dmarc`, and common service hosts (`mail`, `imap`,
  `smtp`, `autodiscover`, `*._domainkey` selectors you know about).
- Authoritative view: read the full zone in the current DNS provider's dashboard
  or export its zone file. Public lookups cannot enumerate every name, and miss
  DKIM selectors and verification records.
- Write the full record table into the repo (for example
  `docs/dns-<registrar>-backup.md`) with type, name, value, and TTL. This is the
  rollback reference and the checklist for step 3.
- Ask the owner whether the domain's email is actually used. It decides step 3.

## 2. Pre-Flight At The Current Registrar

- DNSSEC must be off before the nameserver change, or the domain stops
  resolving. If it is on, turn it off and wait for the DS record's TTL to expire.
- Note the current nameservers; they are the rollback target.

## 3. Add The Zone To Cloudflare

1. Dashboard → Domains → Connect a domain → choose the Free plan unless the
   owner says otherwise. Never pick a paid plan without approval.
2. Cloudflare imports a scan of the records. Reconcile it line by line against
   the snapshot:
   - **Mail records must be DNS only (grey cloud).** The scan often marks mail
     CNAMEs (`mail`, `imap`, `smtp`, `pop`, `webmail`, ...) as Proxied, and that
     breaks IMAP and SMTP. MX records are never proxied.
   - Delete records that the new site replaces (parking `A` records on the
     apex, `www` CNAMEs) and registrar-only features (GoDaddy `_domainconnect`).
   - Add anything the scan missed.
3. Cloudflare then shows two assigned nameservers. Copy them exactly.

If the domain sends and receives **no** email, replace all mail records with:

| Type | Name | Value |
|---|---|---|
| MX | `@` | `.` priority `0` (null MX, RFC 7505) |
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` |
| TXT | `*._domainkey` | `v=DKIM1; p=` |

## 4. Switch Nameservers (The Cutover)

- At the registrar: Nameservers → custom → enter both Cloudflare nameservers →
  save and confirm. Then click "I updated my nameservers" in Cloudflare.
- Propagation is bounded by the TLD's delegation TTL, not the old zone's TTL.
  `.com` delegations are cached for up to 172800 seconds (2 days). Most
  resolvers update within an hour.
- Confirm at the registry: `dig NS <domain> @a.gtld-servers.net +norec`.
- Confirm Cloudflare serves the intended records:
  `dig <type> <name> @<assigned>.ns.cloudflare.com`.

## 5. Attach The Site

- Add `custom_domain` routes for the apex and `www` to the Worker and deploy
  (see `cloudflare-deploy`). This works while the zone is still pending.
- Once the zone is active, turn on SSL/TLS → Edge Certificates → Always Use
  HTTPS so `http://` requests 301 to `https://`.
- Disable the temporary `workers.dev` URL after the domain is verified.

## 6. Verify

- `https://` apex returns 200 with a valid certificate; `www` and `http://`
  return 301 to the canonical host.
- Every kept record resolves to the same value as in the snapshot.
- If email is in use: send and receive a real test message.
- Social preview images now load from the production host.

A background loop that polls until the domain serves the new site is a good way
to wait for activation without blocking on it.

## Rollback

Set the registrar's nameservers back to the originals recorded in step 2. The
old provider's zone stays intact unless someone deletes it, so do not delete it
until the new setup has been stable for a while.

## Gotchas

- Registrar and DNS dashboards often reject embedded or automated browsers at
  sign-in through bot detection. Use the owner's real browser session instead of
  retrying.
- Dashboard tables re-render as rows change; toggling or deleting by screen
  coordinates can hit the wrong row. Act on element references, and re-read the
  table after each batch.
- Cloudflare's record-type picker can land one or two options off when clicked.
  Choose with the keyboard (open, arrow keys, Enter) and check the type before
  saving.
- Wrangler's OAuth token cannot edit DNS. Use the dashboard or a scoped API
  token with `Zone.DNS:Edit`.
