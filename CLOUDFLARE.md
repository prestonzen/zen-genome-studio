# Protected Cloudflare deployment

Zen Genome Studio uses Cloudflare Pages for the Vite interface, Pages Functions for authentication and report APIs, and one private R2 bucket for compact derived reports.

```text
Local computer                         Cloudflare
-----------------------------------    ---------------------------------
VCF / FASTQ / Genozip (never sent)     Pages: React interface
OpenCRAVAT and analysis tools           Functions: password + fixed APIs
Private JSON summary cache       --->   R2: four small JSON summaries
```

OpenCRAVAT and sequencing pipelines stay local. Cloudflare receives no VCF, FASTQ, Genozip, BAM, CRAM, SQLite job database, or source path.

## Security behavior

- `SITE_PASSWORD` absent: the site is an unblocked public demo and R2 personal reports are not served.
- `SITE_PASSWORD` present: every page, asset, and API route requires the password.
- `SITE_PASSWORD` present but shorter than 12 characters, or `SESSION_SECRET` missing or shorter than 32 characters: the deployment fails closed with HTTP 503.
- Successful logins receive a 12-hour `HttpOnly`, `SameSite=Strict` signed cookie. Production cookies are also `Secure`.
- Changing either secret invalidates existing sessions.
- R2 is accessed only through a private binding. Do not enable an R2 public development URL or custom domain.
- Report APIs use fixed object keys. There is no endpoint that accepts a path, filename, bucket key, upload, or download URL from a visitor.
- Protected responses are `no-store`, cannot be framed, and tell search engines not to index or archive them.

A shared password is convenient for family viewing. For a clinician, Cloudflare Access with an allowlisted email and one-time PIN is stronger because access can be revoked per person. Confirm that a clinician is allowed to receive genetic information through this channel; this project does not claim HIPAA or clinical-portal compliance.

## One-time setup

Run from the project folder:

```powershell
npm ci
npx wrangler login
npx wrangler r2 bucket create zen-genome-studio-private
npx wrangler pages project create zen-genome-studio --production-branch main
```

Add the shared password interactively. It is encrypted by Cloudflare and is not written to the repository:

```powershell
npx wrangler pages secret put SITE_PASSWORD --project-name zen-genome-studio
```

Use at least 12 characters and do not reuse an account password.

Generate a separate random signing secret, then paste the printed value into the second command:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
npx wrangler pages secret put SESSION_SECRET --project-name zen-genome-studio
```

The Pages project also needs an R2 binding named `GENOME_REPORTS` pointed at `zen-genome-studio-private`. `wrangler.jsonc` declares it for Wrangler deployments. For a dashboard-managed GitHub deployment, verify it under **Workers & Pages → zen-genome-studio → Settings → Bindings** and redeploy after changing a binding.

## Publish the private summaries

```powershell
npm run publish:cloud-reports
```

This refreshes the trait cache when needed, validates the four allowlisted JSON summaries, rejects raw-data filenames and local paths, uploads the summaries, then uploads a manifest. The current limits are:

| Report | R2 key |
| --- | --- |
| Traits | `reports/trait-report.json` |
| Clinical summary | `reports/clinical-report.json` |
| Ancestry summary | `reports/ancestry-report.json` |
| Height score snapshot | `reports/pgs-height-result.json` |

Each object is capped at 2 MB. Publishing results does not deploy code and does not require the raw read archive.

## Deploy Pages

```powershell
npm run deploy:cloudflare
npm run check:cloudflare
```

Use the Wrangler command above or Git integration. Do not deploy this project with the dashboard's drag-and-drop uploader: Cloudflare does not compile the root `functions/` directory for drag-and-drop deployments, so the password wall and report APIs would be missing even though the Vite interface appears online.

For GitHub auto-deploys, use:

- Repository: `prestonzen/zen-genome-studio`
- Production branch: `main`
- Build command: `npm run build`
- Build output: `dist`
- Root directory: `/`

Add `SITE_PASSWORD` and `SESSION_SECRET` as encrypted secrets in the production environment. Preview environments without the password remain demo-only even if an R2 binding exists.

## Connect `dna.prestonzen.com`

In Cloudflare, open **Workers & Pages → zen-genome-studio → Custom domains → Set up a domain**, enter `dna.prestonzen.com`, and activate it. When `prestonzen.com` is already a Cloudflare zone, Cloudflare normally creates the DNS record and certificate automatically.

Associate the domain through the Pages project before manually creating a CNAME. Optionally redirect the generated `*.pages.dev` hostname to `dna.prestonzen.com` so there is one canonical address.

Under **Security → WAF → Rate limiting rules**, add a rule for `POST /api/auth/login` and apply a managed challenge after repeated attempts. Availability and exact limits depend on the Cloudflare plan.

## Local cloud-mode test

Publish the summaries to Wrangler's local R2 simulator:

```powershell
npm run preview:cloudflare:reports
```

To test the password wall locally, create an ignored `.dev.vars` file containing:

```dotenv
SITE_PASSWORD="a-test-password"
SESSION_SECRET="a-local-signing-secret-at-least-32-characters-long"
```

Wrangler normally serves the Pages build at `http://127.0.0.1:8788/`. Never reuse the real production password in `.dev.vars`.

## Refresh or revoke

- Updated local result: run `npm run publish:cloud-reports`; no Pages redeploy is needed.
- Rotate access: update `SITE_PASSWORD` or `SESSION_SECRET`; current login cookies immediately become invalid.
- Public demo mode: remove `SITE_PASSWORD`. Personal R2 objects remain private and the APIs return demo/empty states.
- Remove cloud results: delete the five fixed `reports/*` objects from R2.

## Official references

- [Pages middleware](https://developers.cloudflare.com/pages/functions/middleware/)
- [Pages bindings and secrets](https://developers.cloudflare.com/pages/functions/bindings/)
- [R2 Wrangler commands](https://developers.cloudflare.com/r2/reference/wrangler-commands/)
- [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [WAF rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Direct Upload and Pages Functions](https://developers.cloudflare.com/pages/get-started/direct-upload/#functions)
