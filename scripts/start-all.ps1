$ErrorActionPreference = 'Stop'

& (Join-Path $PSScriptRoot 'start-wrapper.ps1')

$linuxScriptPath = (wsl -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'start-opencravat.sh')).Trim()
wsl -d Ubuntu -- bash $linuxScriptPath

Start-Sleep -Seconds 2
Start-Process 'http://127.0.0.1:4173/'

