# Runbook: Custom domain for the GitHub Pages site (`spir.genea.no`)

How to point `https://spir.genea.no` at the GitHub Pages deployment of the web
front end, get a valid TLS certificate, and keep the domain pinned across
redeploys.

- **Repo:** `prudentmildew/spir-demo` (public, personal account)
- **Pages source:** GitHub Actions (workflow: `.github/workflows/deploy-pages.yml`)
- **Target domain:** `spir.genea.no` (a *subdomain* of `genea.no`)
- **Default Pages URL:** `https://prudentmildew.github.io/spir-demo/`
  (auto-redirects to the custom domain once it's active)

> **Note — the API is not deployed.** This site is the static front end only.
> Its `/query` and `/health` calls 404 in production by design. A working
> domain + TLS does **not** mean the agent answers; that's expected.

---

## How the pieces fit

1. **The workflow** builds `apps/web` and publishes `apps/web/dist` to Pages on
   every push to `main`.
2. **`apps/web/public/CNAME`** (contains `spir.genea.no`) is copied verbatim
   into `dist/` by Vite. GitHub reads this file from the deployed artifact and
   keeps the custom domain set — so a redeploy can never silently drop it.
3. **A DNS `CNAME` record** at the `genea.no` provider points `spir` at
   `prudentmildew.github.io`. This is the part GitHub can't do for you.
4. **GitHub provisions a Let's Encrypt certificate** automatically once the DNS
   record resolves correctly.

Steps 1–2 are already in the repo. Step 3 is manual (below). The Pages repo
setting and the stored custom domain were applied via the API during setup; the
commands are included below for reproducibility.

---

## Step 1 — DNS: add the subdomain CNAME record

At whoever hosts DNS for **`genea.no`**, add:

| Field  | Value                     |
|--------|---------------------------|
| Type   | `CNAME`                   |
| Host   | `spir`  (i.e. `spir.genea.no`) |
| Value  | `prudentmildew.github.io.` |
| TTL    | `3600` (or provider default) |

Notes:
- Point at the **user** subdomain `prudentmildew.github.io`, **not** at the repo
  path and **not** at a raw IP. (Apex domains like `genea.no` itself would need
  `A`/`AAAA` records instead — not applicable here since we use a subdomain.)
- The trailing dot on the value is correct for most DNS UIs; some strip it
  automatically.

Verify propagation:

```sh
dig +short spir.genea.no
# expect: prudentmildew.github.io.  then a set of 185.199.10x.153 addresses
```

---

## Step 2 — GitHub Pages settings (already applied via API)

These were set during setup. To reproduce or re-apply with the `gh` CLI:

```sh
# Enable Pages with the GitHub Actions build type (idempotent-ish: 409 if it
# already exists — then use the PUT below instead).
gh api -X POST repos/prudentmildew/spir-demo/pages \
  -f build_type=workflow

# Set / re-assert the custom domain.
gh api -X PUT repos/prudentmildew/spir-demo/pages \
  -f cname=spir.genea.no -F https_enforced=false
```

Or in the UI: **Settings → Pages**
- *Build and deployment → Source* = **GitHub Actions**
- *Custom domain* = `spir.genea.no` → **Save** (triggers a DNS check)

---

## Step 3 — Deploy

Push to `main`, or run the workflow manually:

```sh
gh workflow run "Deploy web to GitHub Pages"
gh run watch   # follow the run
```

The deploy job prints the live URL in its `github-pages` environment.

---

## Step 4 — Wait for the certificate, then enforce HTTPS

After DNS resolves, GitHub issues a Let's Encrypt cert for `spir.genea.no`.
This usually takes a few minutes but can take up to ~24h on first setup.

When **Settings → Pages** shows *"Your site is published at
https://spir.genea.no"* and the "Enforce HTTPS" checkbox is no longer greyed
out, enable it:

```sh
gh api -X PUT repos/prudentmildew/spir-demo/pages -F https_enforced=true
```

(or tick **Enforce HTTPS** in the UI).

---

## Optional — domain verification (anti-takeover)

To stop anyone else from claiming a `*.genea.no` subdomain on their own GitHub
account, verify the domain at the account level:
**Account → Settings → Pages → Add a domain**. GitHub gives you a
`_github-pages-challenge-prudentmildew.genea.no` `TXT` record to add at the DNS
provider, then click **Verify**.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Custom domain box keeps clearing itself | The deployed artifact lacks a `CNAME`. Confirm `apps/web/public/CNAME` exists and contains exactly `spir.genea.no`; it must land at `dist/CNAME`. |
| "Enforce HTTPS" stays greyed out | Cert not issued yet. DNS must resolve to `prudentmildew.github.io` first; then wait. Re-saving the custom domain re-triggers the check. |
| Site loads but assets 404 / blank page | `base` mismatch. With the custom domain, `base` must be `/` (the current default in `vite.config.ts`). Don't set `base: '/spir-demo/'`. |
| Page loads but the agent returns errors | Expected. The API isn't deployed; `/query` and `/health` 404. |
| `dig` returns the old/no record | DNS not propagated yet; wait out the TTL. Check at the registrar that the record saved. |
| Workflow fails at `pnpm install` | Lockfile drift — `--frozen-lockfile` is intentional. Run `pnpm install` locally, commit the updated `pnpm-lock.yaml`. |

---

## Reverting

- **Drop the custom domain:** delete `apps/web/public/CNAME`, clear the domain
  in Settings → Pages (or `gh api -X PUT … -f cname=''`), remove the DNS record.
  The site reverts to `https://prudentmildew.github.io/spir-demo/` — which will
  show broken assets unless you also set `base: '/spir-demo/'` in
  `vite.config.ts`.
- **Stop deploying:** disable or delete `.github/workflows/deploy-pages.yml`.
