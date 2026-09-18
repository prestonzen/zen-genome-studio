import { passwordProtectionEnabled } from '../_lib/auth'
import { privateJsonHeaders, readReportManifest, type CloudEnv, type CloudReportName } from '../_lib/cloud'

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env }) => {
  const manifest = await readReportManifest(env)
  const available = new Set<CloudReportName>(manifest?.reports.map((report) => report.id) ?? [])
  return Response.json({
    mode: 'cloud',
    source: { present: false },
    reads: { present: false },
    ancestry: { present: false },
    reports: {
      trait: available.has('trait'),
      clinical: available.has('clinical'),
      ancestry: available.has('ancestry'),
      polygenic: available.has('pgs-height'),
      publishedAt: manifest?.publishedAt,
    },
    auth: { enabled: passwordProtectionEnabled(env), authenticated: true },
    opencravat: false,
    openCravatUrl: '',
  }, { headers: privateJsonHeaders })
}
