$ErrorActionPreference = 'Continue'

& (Join-Path $PSScriptRoot 'stop-opencravat.ps1')

& (Join-Path $PSScriptRoot 'stop-wrapper.ps1')
