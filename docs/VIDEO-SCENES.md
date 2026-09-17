# Zen Genome Studio: Playwright scene handoff

The app lives at `C:\Users\prestonzen\Documents\ChatGPT\Zen Genetic Data Discovery` on Windows. Ubuntu supplies optional analysis tools; it does not host the project or the private report cache.

Start the local studio with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

Open the URL printed by the launcher, normally `http://127.0.0.1:4173/`. If another editor is already using that port, the launcher chooses the next free one. Keep real names, file paths, clinical findings, and ancestry percentages out of captured frames unless privacy mode is on and the shot has been reviewed.

## Scene map

| Beat | Mood / VO purpose | Action | Stable Playwright target |
| --- | --- | --- | --- |
| 1 | Quiet, private opening | Load the app; hold on the overview title | `[data-testid="scene-overview"]` |
| 2 | Curiosity / scale | Scroll to Genome explorer, then click chromosome 15 | `[data-testid="scene-genome-explorer"]`, then `getByRole('button', { name: /Select chromosome 15/ })` |
| 3 | Concrete explanation | Hold on "Often discussed for" and the HERC2/OCA2 example | `.chromosome-known-for` |
| 4 | Evidence, not destiny | Open the Polygenic tab and show model coverage | `getByRole('tab', { name: 'Polygenic' })` |
| 5 | Human-readable traits | Open Discover and select a trait row | `getByRole('button', { name: 'Discover' })` |
| 6 | Trust / local processing | Open Privacy; show local file access and tool readiness | `getByRole('button', { name: 'Privacy' })` |
| 7 | Grounded close | Return to Overview and frame the chromosome map | `getByRole('button', { name: 'Overview' })` |

## Capture notes

- Capture at 1440 x 900 for desktop scenes and 390 x 844 for one responsive insert.
- Wait for fonts and data before each take: `await page.waitForLoadState('networkidle')`.
- Use deliberate 500-800 ms pauses after clicks so the cut has a clean resting frame.
- Treat the app as a visual source. Recording and VO timing belong in the video workflow, not in the genome app.
