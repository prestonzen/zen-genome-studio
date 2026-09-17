param(
    [ValidateSet('submit', 'preview')]
    [string]$Mode = 'submit'
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimeDir = Join-Path $projectRoot '.runtime'
$pidFile = Join-Path $runtimeDir 'opencravat-wsl.pid'
$stdoutLog = Join-Path $runtimeDir 'opencravat.out.log'
$stderrLog = Join-Path $runtimeDir 'opencravat.err.log'
$linuxScript = (wsl.exe -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'start-opencravat.sh')).Trim()

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (Test-Path -LiteralPath $pidFile) {
    $existingId = [int](Get-Content -LiteralPath $pidFile -Raw)
    if (Get-Process -Id $existingId -ErrorAction SilentlyContinue) {
        Write-Host "OpenCRAVAT is already running at http://127.0.0.1:8080"
        exit 0
    }
}

$arguments = "-d Ubuntu -- bash `"$linuxScript`" $Mode"
$process = Start-Process `
    -FilePath (Get-Command wsl.exe).Source `
    -ArgumentList $arguments `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

$process.Id | Out-File -LiteralPath $pidFile -Encoding ascii
Start-Sleep -Seconds 2

if ($process.HasExited) {
    $errorText = if (Test-Path -LiteralPath $stderrLog) { Get-Content -LiteralPath $stderrLog -Raw } else { '' }
    throw "OpenCRAVAT failed to start. $errorText"
}

Write-Host "OpenCRAVAT is starting in $Mode mode at http://127.0.0.1:8080"
