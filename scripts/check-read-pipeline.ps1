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
$readsName = Get-LocalSetting 'GENOME_READS_NAME'

Write-Host 'Zen Genome Studio - raw-read readiness'
Write-Host '-----------------------------------------'

if (-not $dataDir -or -not $readsName) {
    Write-Host '[missing] Add GENOME_DATA_DIR and GENOME_READS_NAME to .env.local.'
    exit 1
}

$readsPath = Join-Path $dataDir $readsName
if (-not (Test-Path -LiteralPath $readsPath -PathType Leaf)) {
    Write-Host '[missing] The configured reads archive was not found.'
    exit 1
}

$reads = Get-Item -LiteralPath $readsPath
Write-Host ('[ready] Compressed reads detected ({0:N2} GB).' -f ($reads.Length / 1GB))
Write-Host '[safe]  This check does not extract, copy, or upload the archive.'

$wslAvailable = Get-Command wsl.exe -ErrorAction SilentlyContinue
if (-not $wslAvailable) {
    Write-Host '[next]  WSL is not available yet. Install Ubuntu before building a read pipeline.'
    exit 0
}

$genozip = & wsl.exe bash -lc 'command -v genocat || command -v genounzip || true' 2>$null
if ($genozip) {
    Write-Host "[ready] Genozip tools available in Ubuntu: $genozip"
} else {
    Write-Host '[next]  Install Genozip inside Ubuntu before streaming or extracting the reads.'
}

$availableCallers = @()
foreach ($tool in @('bwa-mem2', 'minimap2', 'samtools', 'bcftools')) {
    $resolved = & wsl.exe bash -lc "command -v $tool 2>/dev/null || true" 2>$null
    if ($resolved) { $availableCallers += $tool }
}

if ($availableCallers.Count -gt 0) {
    Write-Host "[info]  Read-pipeline tools already available: $($availableCallers -join ', ')"
} else {
    Write-Host '[next]  Alignment/calling tools are not installed. The current lab VCF remains the best source for compact traits.'
}

Write-Host '[plan]  Raw reads can later support structural variants, HLA, repeat expansions, and call confirmation.'
