$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimeDir = Join-Path $projectRoot '.runtime'
$pidFile = Join-Path $runtimeDir 'wrapper.pid'
$stdoutLog = Join-Path $runtimeDir 'wrapper.out.log'
$stderrLog = Join-Path $runtimeDir 'wrapper.err.log'
$urlFile = Join-Path $runtimeDir 'wrapper.url'
$nodePath = (Get-Command node).Source

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (Test-Path -LiteralPath $pidFile) {
    $existingId = [int](Get-Content -LiteralPath $pidFile -Raw)
    if (Get-Process -Id $existingId -ErrorAction SilentlyContinue) {
        $existingUrl = if (Test-Path -LiteralPath $urlFile) { (Get-Content -LiteralPath $urlFile -Raw).Trim() } else { 'http://127.0.0.1:4173/' }
        Write-Host "Zen Genome Studio is already running at $existingUrl"
        Start-Process $existingUrl
        exit 0
    }
}

$port = 4173
while (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
    $port++
    if ($port -gt 4183) {
        throw 'No free local port was found between 4173 and 4183.'
    }
}
$studioUrl = "http://127.0.0.1:$port/"

$process = Start-Process `
    -FilePath $nodePath `
    -ArgumentList 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', $port, '--strictPort' `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

$process.Id | Out-File -LiteralPath $pidFile -Encoding ascii
$studioUrl | Out-File -LiteralPath $urlFile -Encoding ascii
Start-Sleep -Seconds 1
if ($process.HasExited) {
    $errorText = if (Test-Path -LiteralPath $stderrLog) { Get-Content -LiteralPath $stderrLog -Raw } else { '' }
    throw "Zen Genome Studio failed to start. $errorText"
}
Start-Process $studioUrl
Write-Host "Zen Genome Studio is running at $studioUrl"
