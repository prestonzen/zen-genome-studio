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

& node (Join-Path $PSScriptRoot 'build-private-traits.mjs') --vcf $vcfPath --output $reportPath
if ($LASTEXITCODE -ne 0) {
    throw 'The private trait report could not be generated.'
}

Write-Host 'Trait report ready. Restart or refresh Zen Genome Studio.'
