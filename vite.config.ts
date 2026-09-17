import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function localBridge(): Plugin {
  return {
    name: 'local-opencravat-bridge',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const dataDir = env.GENOME_DATA_DIR
      const vcfName = env.GENOME_VCF_NAME
      const readsName = env.GENOME_READS_NAME
      const openCravatUrl = env.OPENCRAVAT_URL || 'http://127.0.0.1:8080'
      const defaultReportRoot = process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'ZenGenomeStudio', 'private')
        : path.join(process.env.HOME || process.cwd(), '.local', 'share', 'zen-genome-studio', 'private')
      const traitReportPath = env.TRAIT_REPORT_PATH || path.join(defaultReportRoot, 'trait-report.json')

      server.middlewares.use('/api/local-status', async (_request, response) => {
        response.setHeader('Content-Type', 'application/json')

        let source: { present: boolean; bytes?: number } = { present: false }
        let reads: { present: boolean; bytes?: number } = { present: false }
        if (dataDir && vcfName) {
          const vcfPath = path.join(dataDir, vcfName)
          try {
            const stats = fs.statSync(vcfPath)
            source = { present: stats.isFile(), bytes: stats.size }
          } catch {
            source = { present: false }
          }
        }

        if (dataDir && readsName) {
          const readsPath = path.join(dataDir, readsName)
          try {
            const stats = fs.statSync(readsPath)
            reads = { present: stats.isFile(), bytes: stats.size }
          } catch {
            reads = { present: false }
          }
        }

        let opencravat: boolean
        try {
          const result = await fetch(openCravatUrl, { signal: AbortSignal.timeout(1200) })
          opencravat = result.ok
        } catch {
          opencravat = false
        }

        response.end(JSON.stringify({ mode: 'local', source, reads, opencravat, openCravatUrl }))
      })

      server.middlewares.use('/api/trait-report', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        try {
          const report = JSON.parse(fs.readFileSync(traitReportPath, 'utf8')) as Record<string, unknown>
          response.end(JSON.stringify({ ...report, state: 'ready', mode: 'local' }))
        } catch {
          response.statusCode = 200
          response.end(JSON.stringify({
            state: 'missing',
            mode: 'local',
            build: 'GRCh38',
            reportLabel: 'Private trait report',
            sourceNote: 'Run the private trait-report builder once',
            caveat: 'Traits are tendencies, not guarantees.',
            traits: [],
            quickRead: [],
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localBridge()],
  server: {
    port: 4173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
