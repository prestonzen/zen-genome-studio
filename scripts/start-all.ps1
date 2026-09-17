$ErrorActionPreference = 'Stop'

if (Test-Path -LiteralPath (Join-Path $PSScriptRoot '..\.env.local')) {
    & (Join-Path $PSScriptRoot 'build-private-traits.ps1')
}

& (Join-Path $PSScriptRoot 'start-wrapper.ps1')
& (Join-Path $PSScriptRoot 'start-opencravat.ps1')
