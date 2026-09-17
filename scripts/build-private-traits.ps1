param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $projectRoot '.env.local'

if (-not (Test-Path -LiteralPath $envFile)) {
    throw 'Missing .env.local. Add GENOME_DATA_DIR and GENOME_VCF_NAME first.'
}

$settings = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*?)\s*$') {
        $settings[$matches[1]] = $matches[2].Trim('"').Trim("'")
    }
}

if (-not $settings.GENOME_DATA_DIR -or -not $settings.GENOME_VCF_NAME) {
    throw '.env.local must define GENOME_DATA_DIR and GENOME_VCF_NAME.'
}

$vcfPath = Join-Path $settings.GENOME_DATA_DIR $settings.GENOME_VCF_NAME
if (-not (Test-Path -LiteralPath $vcfPath -PathType Leaf)) {
    throw 'The configured private VCF could not be found.'
}

$privateDir = Join-Path $env:LOCALAPPDATA 'ZenGenomeStudio\private'
$reportPath = Join-Path $privateDir 'trait-report.json'
New-Item -ItemType Directory -Force -Path $privateDir | Out-Null

$nodeArgs = @(
    (Join-Path $PSScriptRoot 'build-private-traits.mjs'),
    '--vcf', $vcfPath,
    '--output', $reportPath
)

$sourcePaths = @(
    $vcfPath,
    (Join-Path $PSScriptRoot 'build-private-traits.mjs'),
    $PSCommandPath
)

if ($settings.ANCESTRY_DNA_NAME) {
    $ancestryPath = Join-Path $settings.GENOME_DATA_DIR $settings.ANCESTRY_DNA_NAME
    if (Test-Path -LiteralPath $ancestryPath -PathType Leaf) {
        $sourcePaths += $ancestryPath
        $nodeArgs += @('--ancestry', $ancestryPath)
        if ($settings.ANCESTRY_DNA_RELATION) {
            $nodeArgs += @('--ancestry-relation', $settings.ANCESTRY_DNA_RELATION)
        }
    } else {
        Write-Warning 'The configured AncestryDNA source was not found; continuing with the WGS VCF only.'
    }
}

if ((-not $Force) -and (Test-Path -LiteralPath $reportPath -PathType Leaf)) {
    $reportModified = (Get-Item -LiteralPath $reportPath).LastWriteTimeUtc
    $newestSource = $sourcePaths |
        ForEach-Object { (Get-Item -LiteralPath $_).LastWriteTimeUtc } |
        Sort-Object -Descending |
        Select-Object -First 1

    if ($reportModified -ge $newestSource) {
        $cached = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
        $refreshed = if ($cached.generatedAt) { [DateTimeOffset]::Parse($cached.generatedAt).ToLocalTime().ToString('g') } else { $reportModified.ToLocalTime().ToString('g') }
        Write-Host "Trait report cache is current. Last refreshed $refreshed."
        exit 0
    }
}

& node @nodeArgs
if ($LASTEXITCODE -ne 0) {
    throw 'The private trait report could not be generated.'
}

Write-Host 'Trait report cache refreshed. Reload Zen Genome Studio to see the update.'
