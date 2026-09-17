$ErrorActionPreference = 'Stop'

& (Join-Path $PSScriptRoot 'start-wrapper.ps1')
& (Join-Path $PSScriptRoot 'start-opencravat.ps1')

Start-Sleep -Seconds 2
Start-Process 'http://127.0.0.1:4173/'
