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

if ($settings.ANCESTRY_DNA_NAME) {
    $ancestryPath = Join-Path $settings.GENOME_DATA_DIR $settings.ANCESTRY_DNA_NAME
    if (Test-Path -LiteralPath $ancestryPath -PathType Leaf) {
        $nodeArgs += @('--ancestry', $ancestryPath)
        if ($settings.ANCESTRY_DNA_RELATION) {
            $nodeArgs += @('--ancestry-relation', $settings.ANCESTRY_DNA_RELATION)
        }
    } else {
        Write-Warning 'The configured AncestryDNA source was not found; continuing with the WGS VCF only.'
    }
}

& node @nodeArgs
if ($LASTEXITCODE -ne 0) {
    throw 'The private trait report could not be generated.'
}

Write-Host 'Trait report ready. Restart or refresh Zen Genome Studio.'
