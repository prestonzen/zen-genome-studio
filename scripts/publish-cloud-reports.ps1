param(
    [switch]$Remote
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$privateDir = Join-Path $env:LOCALAPPDATA 'ZenGenomeStudio\private'
$bucket = 'zen-genome-studio-private'
$modeFlag = if ($Remote) { '--remote' } else { '--local' }

& (Join-Path $PSScriptRoot 'build-private-traits.ps1')
if ($LASTEXITCODE -ne 0) {
    throw 'The private trait cache could not be refreshed before publishing.'
}

$reportDefinitions = @(
    [pscustomobject]@{ Id = 'trait'; File = 'trait-report.json'; Key = 'reports/trait-report.json' },
    [pscustomobject]@{ Id = 'clinical'; File = 'clinical-report.json'; Key = 'reports/clinical-report.json' },
    [pscustomobject]@{ Id = 'ancestry'; File = 'ancestry-report.json'; Key = 'reports/ancestry-report.json' },
    [pscustomobject]@{ Id = 'pgs-height'; File = 'pgs-height-result.json'; Key = 'reports/pgs-height-result.json' }
)

$manifestReports = @()
foreach ($definition in $reportDefinitions) {
    $path = Join-Path $privateDir $definition.File
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        Write-Warning "$($definition.File) is not available and will not be published."
        continue
    }

    $file = Get-Item -LiteralPath $path
    if ($file.Length -gt 2MB) {
        throw "$($definition.File) exceeds the 2 MB summary limit. Raw or expanded genomic data must not be published."
    }

    $raw = Get-Content -LiteralPath $path -Raw
    try {
        $json = $raw | ConvertFrom-Json
    } catch {
        throw "$($definition.File) is not valid JSON."
    }

    $forbiddenSourcePattern = '(?i)([a-z]:\\|/mnt/[a-z]/|\.vcf(?:\.gz)?(?:"|$)|\.fastq(?:\.gz)?(?:"|$)|\.genozip(?:"|$)|\.bam(?:"|$)|\.cram(?:"|$))'
    if ($raw -match $forbiddenSourcePattern) {
        throw "$($definition.File) contains a local path or raw-genome filename and was not published."
    }

    $destination = "$bucket/$($definition.Key)"
    $arguments = @('wrangler', 'r2', 'object', 'put', $destination, '--file', $path, '--content-type', 'application/json', '--cache-control', 'private, no-store', $modeFlag, '--force')
    & npx @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Upload failed for $($definition.File)."
    }

    $manifestReports += [ordered]@{
        id = $definition.Id
        key = $definition.Key
        bytes = $file.Length
        sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        generatedAt = $json.generatedAt
    }
    Write-Host "Published protected summary: $($definition.Id) ($($file.Length) bytes)"
}

if ($manifestReports.Count -eq 0) {
    throw 'No private summary reports were available to publish.'
}

$manifestPath = Join-Path ([IO.Path]::GetTempPath()) "zen-genome-manifest-$PID.json"
try {
    [ordered]@{
        schemaVersion = 1
        publishedAt = [DateTimeOffset]::UtcNow.ToString('o')
        reports = $manifestReports
    } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8

    & npx wrangler r2 object put "$bucket/reports/manifest.json" --file $manifestPath --content-type application/json --cache-control 'private, no-store' $modeFlag --force
    if ($LASTEXITCODE -ne 0) {
        throw 'The report manifest could not be published.'
    }
} finally {
    Remove-Item -LiteralPath $manifestPath -Force -ErrorAction SilentlyContinue
}

$target = if ($Remote) { 'private Cloudflare R2' } else { 'the local Wrangler R2 simulator' }
Write-Host "Protected report bundle published to $target. No VCF, FASTQ, Genozip, BAM, CRAM, or source path was uploaded."
