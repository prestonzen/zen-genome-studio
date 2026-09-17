$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot 'setup-analysis-tools.sh'
$linuxScriptPath = (wsl.exe -d Ubuntu -e wslpath -a $scriptPath).Trim()

if (-not $linuxScriptPath) {
    throw 'Ubuntu is not ready. Open Ubuntu once, create your Linux username and password, then retry.'
}

wsl.exe -d Ubuntu -e bash $linuxScriptPath
