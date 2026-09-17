# Cloudflare deployment

## Supported architecture

Cloudflare Pages serves the React interface and `functions/api/local-status.ts` provides a privacy-safe cloud status response. The same interface uses the local Vite bridge during local development, so one codebase supports both modes:

```text
Cloudflare Pages                 Local or private server
------------------------------   -------------------------------
React recording interface        OpenCRAVAT GUI and annotators
Reference/demo chromosomes        Multi-gigabyte reference modules
No genome upload endpoint         Private VCF and result databases
No personal findings              Long-running annotation jobs
```

The cloud interface is useful for the TikTok visual, project demos, and future server navigation. It deliberately cannot inspect a local file or start an annotation job.

## Why OpenCRAVAT does not run in a Worker

Cloudflare Python Workers are real Python through Pyodide, but they are not a Linux Python server. OpenCRAVAT is a poor fit because:

- Workers have 128 MB of memory per isolate.
- The Worker bundle is limited and static assets are limited to 25 MB each.
- Python Worker storage is ephemeral and is not shared between isolates.
- Python `multiprocessing` and `threading` are present but nonfunctional.
- OpenCRAVAT's base mapper alone is about 2 GB, before optional annotation modules.
- Whole-genome annotation can run for hours and writes persistent SQLite job data.
- The current VCF is larger than the standard Free/Pro request-body limit, so it should not be proxied through a Worker.

JavaScript VCF parsers can render small or indexed slices, but they do not replace OpenCRAVAT's annotation engine and reference databases.

## Local Cloudflare preview

```powershell
npm install
npm run preview:cloudflare
```

Wrangler serves the production assets and Pages Function at `http://127.0.0.1:8788/`. The API should return `mode: "cloud"`, `source.present: false`, and no analysis URL.

## Deploy

```powershell
npx wrangler login
npm run deploy:cloudflare
```

The Pages configuration is in `wrangler.jsonc`; the output directory is `dist`. Deployment is intentionally not automated from this machine until the Cloudflare account and desired project visibility are confirmed.

## Later private-server migration

Run OpenCRAVAT on the server with persistent SSD storage and enough RAM, then place its web/API layer behind Cloudflare Tunnel and Cloudflare Access. The safe connection pattern is:

1. Browser uploads the VCF directly to the authenticated private server, not through a Worker.
2. The server stores jobs and OpenCRAVAT modules on its own persistent disk.
3. Pages calls only lightweight authenticated status and result-summary endpoints.
4. Detailed result pages remain behind Cloudflare Access.
5. The public recording view continues to expose only demo/reference data.

Do not expose the stock OpenCRAVAT GUI directly to the public internet. Use authentication, HTTPS, upload limits, audit logs, and a separate non-root service account on the server.

## Official references

- [Cloudflare Python Workers](https://developers.cloudflare.com/workers/languages/python/)
- [Python Worker standard library and filesystem](https://developers.cloudflare.com/workers/languages/python/stdlib/)
- [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
