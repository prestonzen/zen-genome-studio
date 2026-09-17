$ErrorActionPreference = 'Continue'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimeDir = Join-Path $projectRoot '.runtime'
$pidFile = Join-Path $runtimeDir 'opencravat-wsl.pid'
$linuxScript = (wsl.exe -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'stop-opencravat.sh')).Trim()

wsl.exe -d Ubuntu -- bash $linuxScript

if (Test-Path -LiteralPath $pidFile) {
    $processId = [int](Get-Content -LiteralPath $pidFile -Raw)
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -eq 'wsl') {
        Stop-Process -Id $processId -Force
    }
    Remove-Item -LiteralPath $pidFile -Force
}
