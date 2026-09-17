$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $projectRoot '.env.local'

if (-not (Test-Path -LiteralPath $envFile)) {
    throw 'Create .env.local from .env.example first.'
}

$settings = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^([A-Z_]+)=(.*)$') {
        $settings[$Matches[1]] = $Matches[2]
    }
}

$sourcePath = Join-Path $settings.GENOME_DATA_DIR $settings.GENOME_VCF_NAME
if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw 'The configured private VCF was not found.'
}

$createScript = (wsl.exe -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'create-private-preview.sh')).Trim()
$runScript = (wsl.exe -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'run-private-preview.sh')).Trim()
$linuxSource = (wsl.exe -d Ubuntu -- wslpath -a $sourcePath).Trim()

wsl.exe -d Ubuntu -- bash $createScript $linuxSource
if ($LASTEXITCODE -ne 0) { throw 'Could not create the private preview.' }

wsl.exe -d Ubuntu -- bash $runScript
if ($LASTEXITCODE -ne 0) { throw 'Could not annotate the private preview.' }

Write-Host 'Private annotated preview is ready.'
Write-Host 'Open it with .\scripts\start-preview-viewer.ps1'
