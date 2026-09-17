import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { heightPgsModel } from './src/data/pgsCatalog.ts'

function localBridge(): Plugin {
  return {
    name: 'local-opencravat-bridge',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const dataDir = env.GENOME_DATA_DIR
      const vcfName = env.GENOME_VCF_NAME
      const readsName = env.GENOME_READS_NAME
      const ancestryName = env.ANCESTRY_DNA_NAME
      const openCravatUrl = env.OPENCRAVAT_URL || 'http://127.0.0.1:8080'
      const defaultReportRoot = process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'ZenGenomeStudio', 'private')
        : path.join(process.env.HOME || process.cwd(), '.local', 'share', 'zen-genome-studio', 'private')
      const traitReportPath = env.TRAIT_REPORT_PATH || path.join(defaultReportRoot, 'trait-report.json')
      const pgsDir = path.join(defaultReportRoot, 'pgs-catalog')
      const pgsPath = path.join(pgsDir, heightPgsModel.fileName)
      const pgsMetadataPath = path.join(pgsDir, `${heightPgsModel.id}.json`)

      function pgsState(note?: string) {
        let installed: boolean
        let bytes: number | undefined
        let installedAt: string | undefined
        try {
          const stats = fs.statSync(pgsPath)
          installed = stats.isFile()
          bytes = stats.size
          installedAt = stats.mtime.toISOString()
        } catch {
          installed = false
        }
        return { mode: 'local', installed, bytes, installedAt, model: heightPgsModel, note }
      }

      server.middlewares.use('/api/local-status', async (_request, response) => {
        response.setHeader('Content-Type', 'application/json')

        let source: { present: boolean; bytes?: number } = { present: false }
        let reads: { present: boolean; bytes?: number } = { present: false }
        let ancestry: { present: boolean; bytes?: number } = { present: false }
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

        if (dataDir && ancestryName) {
          const ancestryPath = path.join(dataDir, ancestryName)
          try {
            const stats = fs.statSync(ancestryPath)
            ancestry = { present: stats.isFile(), bytes: stats.size }
          } catch {
            ancestry = { present: false }
          }
        }

        let opencravat: boolean
        try {
          const result = await fetch(openCravatUrl, { signal: AbortSignal.timeout(1200) })
          opencravat = result.ok
        } catch {
          opencravat = false
        }

        response.end(JSON.stringify({ mode: 'local', source, reads, ancestry, opencravat, openCravatUrl }))
      })

      server.middlewares.use('/api/pipeline-status', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        const tools = { archive: false, aligner: false, variants: false, polygenic: false }
        try {
          const script = 'for tool in genocat genounzip bwa-mem2 minimap2 samtools bcftools nextflow; do command -v "$tool" >/dev/null 2>&1 && echo "$tool"; done; exit 0'
          const output = execFileSync('wsl.exe', ['bash', '-lc', script], { encoding: 'utf8', timeout: 8000 })
          const found = new Set(output.split(/\r?\n/).filter(Boolean))
          tools.archive = found.has('genocat') || found.has('genounzip')
          tools.aligner = found.has('bwa-mem2') || found.has('minimap2')
          tools.variants = found.has('samtools') && found.has('bcftools')
          tools.polygenic = found.has('nextflow')
          response.end(JSON.stringify({ mode: 'local', available: true, tools, note: 'Checked inside the local Ubuntu environment.' }))
        } catch {
          response.end(JSON.stringify({ mode: 'local', available: false, tools, note: 'Ubuntu could not be checked yet.' }))
        }
      })

      server.middlewares.use('/api/pgs-model', async (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        if (request.method === 'GET') {
          response.end(JSON.stringify(pgsState()))
          return
        }
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          if (!fs.existsSync(pgsPath)) {
            const download = await fetch(heightPgsModel.downloadUrl, { signal: AbortSignal.timeout(60_000) })
            if (!download.ok) throw new Error(`PGS Catalog returned ${download.status}`)
            const payload = Buffer.from(await download.arrayBuffer())
            if (payload[0] !== 0x1f || payload[1] !== 0x8b) throw new Error('Downloaded score is not a gzip file')
            fs.mkdirSync(pgsDir, { recursive: true })
            const temporaryPath = `${pgsPath}.download`
            fs.writeFileSync(temporaryPath, payload, { mode: 0o600 })
            fs.renameSync(temporaryPath, pgsPath)
            fs.writeFileSync(pgsMetadataPath, `${JSON.stringify({ ...heightPgsModel, installedAt: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 })
          }
          response.end(JSON.stringify(pgsState('Public scoring weights downloaded locally. No genome data was uploaded.')))
        } catch (error) {
          response.statusCode = 502
          response.end(JSON.stringify({ ...pgsState(), error: error instanceof Error ? error.message : 'The model could not be downloaded.' }))
        }
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
