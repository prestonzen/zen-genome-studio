import fs from 'node:fs'
import path from 'node:path'
import { execFile, execFileSync, spawn } from 'node:child_process'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { heightPgsModel, pgsModels } from './src/data/pgsCatalog.ts'

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
      const clinicalReportPath = env.CLINICAL_REPORT_PATH || path.join(defaultReportRoot, 'clinical-report.json')
      const ancestryReportPath = env.ANCESTRY_REPORT_PATH || path.join(defaultReportRoot, 'ancestry-report.json')
      const pgsDir = path.join(defaultReportRoot, 'pgs-catalog')
      const pgsPath = path.join(pgsDir, heightPgsModel.fileName)
      const pgsResultPath = path.join(defaultReportRoot, 'pgs-height-result.json')
      const pgsBundleScriptPath = path.join(process.cwd(), 'scripts', 'build-private-pgs.ps1')
      const toolSetupScriptPath = path.join(process.cwd(), 'scripts', 'setup-analysis-tools.sh')

      function ubuntuCanRead(filePath?: string) {
        if (!filePath) return false
        try {
          const linuxPath = execFileSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'wslpath', '-a', filePath], { encoding: 'utf8', timeout: 5000 }).trim()
          execFileSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'test', '-r', linuxPath], { timeout: 5000 })
          return true
        } catch {
          return false
        }
      }

      function pgsState(note?: string) {
        let bytes: number | undefined
        let installedAt: string | undefined
        try {
          const stats = fs.statSync(pgsPath)
          if (stats.isFile()) {
            bytes = stats.size
            installedAt = stats.mtime.toISOString()
          }
        } catch { /* Model status is reported below. */ }
        const models = pgsModels.map((model) => {
          const modelPath = path.join(pgsDir, model.fileName)
          try {
            const modelStats = fs.statSync(modelPath)
            return { ...model, installed: modelStats.isFile(), bytes: modelStats.size, installedAt: modelStats.mtime.toISOString() }
          } catch {
            return { ...model, installed: false }
          }
        })
        return { mode: 'local', installed: models.every((model) => model.installed), bytes, installedAt, model: heightPgsModel, models, note }
      }

      function pgsResultState() {
        try {
          return { ...JSON.parse(fs.readFileSync(pgsResultPath, 'utf8')), state: 'ready', mode: 'local' }
        } catch {
          return {
            state: 'missing', mode: 'local', modelId: heightPgsModel.id, trait: 'Standing height',
            modelVariants: heightPgsModel.variants, matchedVariants: 0, coveragePercent: 0, weightCoveragePercent: 0,
            interpretation: 'No personal calculation has been run.', nextStep: 'Calculate against the private VCF.', sourceNote: 'No result yet.',
          }
        }
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

        response.end(JSON.stringify({ mode: 'local', source, reads, ancestry, auth: { enabled: false, authenticated: true }, opencravat, openCravatUrl }))
      })

      server.middlewares.use('/api/pipeline-status', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        const tools = { archive: false, aligner: false, variants: false, polygenic: false }
        const files = {
          vcf: ubuntuCanRead(dataDir && vcfName ? path.join(dataDir, vcfName) : undefined),
          reads: ubuntuCanRead(dataDir && readsName ? path.join(dataDir, readsName) : undefined),
        }
        try {
          const script = 'export PATH="$HOME/.local/bin:$PATH"; . /etc/os-release; printf "__DISTRO__=%s\\n" "$NAME"; printf "__USER__=%s\\n" "$(id -un)"; for tool in genocat genounzip bwa-mem2 minimap2 samtools bcftools nextflow; do command -v "$tool" >/dev/null 2>&1 && echo "$tool"; done; exit 0'
          const output = execFileSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'bash', '-lc', script], { encoding: 'utf8', timeout: 8000 })
          const lines = output.split(/\r?\n/).filter(Boolean)
          const found = new Set(lines)
          tools.archive = found.has('genocat') || found.has('genounzip')
          tools.aligner = found.has('bwa-mem2') || found.has('minimap2')
          tools.variants = found.has('samtools') && found.has('bcftools')
          tools.polygenic = found.has('nextflow')
          const readyCount = Object.values(tools).filter(Boolean).length
          const distribution = lines.find((line) => line.startsWith('__DISTRO__='))?.split('=')[1] || 'Ubuntu'
          const user = lines.find((line) => line.startsWith('__USER__='))?.split('=')[1]
          const fileNote = files.vcf && files.reads ? ' Both configured genome files are readable.' : ' One or more configured genome files still need access.'
          const note = readyCount === 4 ? `Ubuntu and all optional analysis toolkits are ready.${fileNote}` : `Ubuntu is working. ${readyCount} of 4 optional deep-analysis toolkits are installed.${fileNote}`
          response.end(JSON.stringify({ mode: 'local', available: true, distribution, user, tools, files, note }))
        } catch {
          response.end(JSON.stringify({ mode: 'local', available: false, tools, files, note: 'Ubuntu could not be checked yet.' }))
        }
      })

      server.middlewares.use('/api/open-tool-setup', (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        if (request.headers['x-zen-local'] !== '1') {
          response.statusCode = 403
          response.end(JSON.stringify({ error: 'Local request confirmation is required.' }))
          return
        }
        try {
          const linuxScriptPath = execFileSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'wslpath', '-a', toolSetupScriptPath], { encoding: 'utf8', timeout: 5000 }).trim()
          const child = spawn('wt.exe', ['-w', '0', 'new-tab', '--title', 'Zen Genome Tools', 'wsl.exe', '-d', 'Ubuntu', '--', 'bash', linuxScriptPath], { detached: true, stdio: 'ignore', windowsHide: false })
          child.unref()
          response.end(JSON.stringify({ launched: true }))
        } catch (error) {
          response.statusCode = 500
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Setup could not be opened.' }))
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
        if (request.headers['x-zen-local'] !== '1') {
          response.statusCode = 403
          response.end(JSON.stringify({ ...pgsState(), error: 'Local request confirmation is required.' }))
          return
        }

        try {
          fs.mkdirSync(pgsDir, { recursive: true })
          for (const model of pgsModels) {
            const modelPath = path.join(pgsDir, model.fileName)
            if (fs.existsSync(modelPath)) continue
            const download = await fetch(model.downloadUrl, { signal: AbortSignal.timeout(120_000) })
            if (!download.ok) throw new Error(`${model.id} download returned ${download.status}`)
            const payload = Buffer.from(await download.arrayBuffer())
            if (payload[0] !== 0x1f || payload[1] !== 0x8b) throw new Error(`${model.id} is not a gzip scoring file`)
            const temporaryPath = `${modelPath}.download`
            fs.writeFileSync(temporaryPath, payload, { mode: 0o600 })
            fs.renameSync(temporaryPath, modelPath)
            fs.writeFileSync(path.join(pgsDir, `${model.id}.json`), `${JSON.stringify({ ...model, installedAt: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 })
          }
          response.end(JSON.stringify(pgsState('Three public research models are cached locally. No genome data was uploaded.')))
        } catch (error) {
          response.statusCode = 502
          response.end(JSON.stringify({ ...pgsState(), error: error instanceof Error ? error.message : 'The model could not be downloaded.' }))
        }
      })

      server.middlewares.use('/api/pgs-result', async (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        if (request.method === 'GET') {
          response.end(JSON.stringify(pgsResultState()))
          return
        }
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        if (request.headers['x-zen-local'] !== '1') {
          response.statusCode = 403
          response.end(JSON.stringify({ ...pgsResultState(), state: 'error', error: 'Local request confirmation is required.' }))
          return
        }
        if (!dataDir || !vcfName || !fs.existsSync(pgsPath)) {
          response.statusCode = 400
          response.end(JSON.stringify({ ...pgsResultState(), state: 'error', error: 'The private VCF and PGS model must both be available.' }))
          return
        }
        try {
          await new Promise<void>((resolve, reject) => {
            execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', pgsBundleScriptPath], { timeout: 900_000, windowsHide: true }, (error) => error ? reject(error) : resolve())
          })
          response.end(JSON.stringify(pgsResultState()))
        } catch (error) {
          response.statusCode = 500
          response.end(JSON.stringify({ ...pgsResultState(), state: 'error', error: error instanceof Error ? error.message : 'The score could not be calculated.' }))
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

      server.middlewares.use('/api/clinical-report', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        try {
          const report = JSON.parse(fs.readFileSync(clinicalReportPath, 'utf8')) as Record<string, unknown>
          response.end(JSON.stringify({ ...report, state: 'ready', mode: 'local' }))
        } catch {
          response.end(JSON.stringify({
            state: 'missing',
            mode: 'local',
            reportLabel: 'Private clinical report',
            sourceNote: 'No clinician-reviewed summary is connected',
            primaryFindings: { status: 'Not connected', note: 'Add a private clinical-report.json file to view the laboratory report here.' },
            secondaryFindings: { status: 'Not connected', panel: 'Not connected', note: 'No clinical report data is available.' },
            carrierFindings: [],
            incidentalFindings: [],
            limitations: [],
          }))
        }
      })

      server.middlewares.use('/api/ancestry-report', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        try {
          const report = JSON.parse(fs.readFileSync(ancestryReportPath, 'utf8')) as Record<string, unknown>
          response.end(JSON.stringify({ ...report, state: 'ready', mode: 'local' }))
        } catch {
          response.end(JSON.stringify({
            state: 'missing',
            mode: 'local',
            sourceName: 'Private ancestry report',
            sourceNote: 'No imported ancestry estimate is connected',
            profiles: [],
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
