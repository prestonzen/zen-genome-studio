$ErrorActionPreference = 'Stop'

$privateReport = Join-Path $env:LOCALAPPDATA 'ZenGenomeStudio\private\trait-report.json'
if ((Test-Path -LiteralPath (Join-Path $PSScriptRoot '..\.env.local')) -and -not (Test-Path -LiteralPath $privateReport)) {
    & (Join-Path $PSScriptRoot 'build-private-traits.ps1')
}

& (Join-Path $PSScriptRoot 'start-wrapper.ps1')
& (Join-Path $PSScriptRoot 'start-opencravat.ps1')

Start-Sleep -Seconds 2
Start-Process 'http://127.0.0.1:4173/'
