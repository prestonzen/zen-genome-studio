param(
    [switch]$PublishReports
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$env:CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false'

if ($PublishReports) {
    & (Join-Path $PSScriptRoot 'publish-cloud-reports.ps1')
}

Push-Location $projectRoot
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw 'The cloud preview build failed.' }
    & npx wrangler pages dev
    if ($LASTEXITCODE -ne 0) { throw 'The Cloudflare preview stopped with an error.' }
} finally {
    Pop-Location
}
