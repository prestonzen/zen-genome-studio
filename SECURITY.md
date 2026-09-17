# Privacy and security

This repository contains interface code only. It must never contain raw genome data, annotated result databases, exports, screenshots showing personal findings, or local path settings.

The private source folder is configured only in `.env.local`, which Git ignores. The interface returns only a generic source label, presence state, and file size. It does not expose the real path or filename to the browser.

The Cloudflare deployment contains no upload route. Its status and report Functions always return privacy-safe empty or demo states. Do not add VCF, FASTQ, BAM, CRAM, Genozip, SQLite result files, private clinical or ancestry summary JSON, private screenshots, or `.env.local` values to Pages, Workers, R2, KV, D1, build logs, or Git history.

Before recording or sharing a screen:

1. Keep **Record-safe mode** on.
2. Close File Explorer and terminal windows that show private paths.
3. Record the wrapper first; open detailed results only after checking the frame.
4. Treat OpenCRAVAT output as research information, not a diagnosis.
