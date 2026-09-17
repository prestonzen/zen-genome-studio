$ErrorActionPreference = 'Continue'

$linuxScriptPath = (wsl -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'stop-opencravat.sh')).Trim()
if ($linuxScriptPath) {
    wsl -d Ubuntu -- bash $linuxScriptPath
}

& (Join-Path $PSScriptRoot 'stop-wrapper.ps1')

