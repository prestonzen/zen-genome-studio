$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot 'setup-opencravat.sh'
$linuxScriptPath = (wsl -d Ubuntu -- wslpath -a $scriptPath).Trim()

if (-not $linuxScriptPath) {
    throw 'Ubuntu is not ready. Open Ubuntu once, create your Linux username and password, then retry.'
}

wsl -d Ubuntu -- bash $linuxScriptPath

