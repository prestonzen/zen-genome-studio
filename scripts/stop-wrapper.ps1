$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pidFile = Join-Path $projectRoot '.runtime\wrapper.pid'

if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Host 'Zen Genome Studio is not running.'
    exit 0
}

$processId = [int](Get-Content -LiteralPath $pidFile -Raw)
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue

if ($process -and $process.ProcessName -eq 'node') {
    Stop-Process -Id $processId
    Write-Host 'Zen Genome Studio stopped.'
} else {
    Write-Host 'The saved process was already stopped.'
}

Remove-Item -LiteralPath $pidFile -Force
