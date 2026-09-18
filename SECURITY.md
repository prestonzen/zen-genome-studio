# Privacy and security

This repository contains interface and deployment code only. It must never contain raw genome data, annotated result databases, private summary JSON, exports, screenshots showing personal findings, passwords, signing secrets, or local path settings.

The private source folder is configured only in `.env.local`, which Git ignores. The interface returns only a generic source label, presence state, and file size. It does not expose the real path or filename to the browser.

The Cloudflare deployment contains no upload route. A password-gated deployment may read four compact summaries from a private R2 binding. Only `scripts/publish-cloud-reports.ps1` should publish those fixed objects. Do not add VCF, FASTQ, BAM, CRAM, Genozip, SQLite result files, private summary JSON, private screenshots, `.env.local`, or `.dev.vars` values to Pages static assets, Workers bundles, build logs, or Git history.

Before sharing access:

1. Use a unique password of at least 12 characters and a separate random `SESSION_SECRET`.
2. Keep the R2 bucket private; do not enable its public URL or attach a public R2 domain.
3. Rotate secrets after temporary sharing and remove R2 objects when they are no longer needed.
4. Prefer Cloudflare Access with an allowlisted email for clinician sharing.
5. Add a Cloudflare WAF rate limit to `POST /api/auth/login` when the plan supports it.
6. Treat OpenCRAVAT and trait output as research information, not a diagnosis.
