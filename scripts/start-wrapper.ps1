$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimeDir = Join-Path $projectRoot '.runtime'
$pidFile = Join-Path $runtimeDir 'wrapper.pid'
$stdoutLog = Join-Path $runtimeDir 'wrapper.out.log'
$stderrLog = Join-Path $runtimeDir 'wrapper.err.log'
$nodePath = (Get-Command node).Source

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (Test-Path -LiteralPath $pidFile) {
    $existingId = [int](Get-Content -LiteralPath $pidFile -Raw)
    if (Get-Process -Id $existingId -ErrorAction SilentlyContinue) {
        Write-Host 'Preston Genome Studio is already running.'
        Start-Process 'http://127.0.0.1:4173/'
        exit 0
    }
}

$process = Start-Process `
    -FilePath $nodePath `
    -ArgumentList 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173' `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

$process.Id | Out-File -LiteralPath $pidFile -Encoding ascii
Start-Sleep -Seconds 1
Start-Process 'http://127.0.0.1:4173/'
Write-Host 'Preston Genome Studio is running at http://127.0.0.1:4173/'

