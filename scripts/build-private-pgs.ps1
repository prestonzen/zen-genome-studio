$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envPath = Join-Path $projectRoot '.env.local'

function Get-LocalSetting([string]$name) {
    if (-not (Test-Path -LiteralPath $envPath)) { return $null }
    $line = Get-Content -LiteralPath $envPath | Where-Object { $_ -match "^$([regex]::Escape($name))=" } | Select-Object -First 1
    if (-not $line) { return $null }
    return ($line -split '=', 2)[1]
}

$dataDir = Get-LocalSetting 'GENOME_DATA_DIR'
$vcfName = Get-LocalSetting 'GENOME_VCF_NAME'
if (-not $dataDir -or -not $vcfName) { throw 'GENOME_DATA_DIR and GENOME_VCF_NAME must be configured in .env.local.' }

$privateRoot = Join-Path $env:LOCALAPPDATA 'ZenGenomeStudio\private'
$scorePath = Join-Path $privateRoot 'pgs-catalog\PGS003895_hmPOS_GRCh38.txt.gz'
$outputPath = Join-Path $privateRoot 'pgs-height-result.json'
$vcfPath = Join-Path $dataDir $vcfName

if (-not (Test-Path -LiteralPath $scorePath)) { throw 'Add the PGS003895 model in the app before calculating the score.' }
if (-not (Test-Path -LiteralPath $vcfPath)) { throw 'The configured VCF was not found.' }

node (Join-Path $PSScriptRoot 'build-private-pgs.mjs') --vcf $vcfPath --score $scorePath --output $outputPath
