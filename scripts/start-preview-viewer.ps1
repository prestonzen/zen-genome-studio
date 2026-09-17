$ErrorActionPreference = 'Stop'

& (Join-Path $PSScriptRoot 'stop-opencravat.ps1')
& (Join-Path $PSScriptRoot 'start-opencravat.ps1') -Mode preview

Start-Sleep -Seconds 5
$linuxHome = (wsl.exe -d Ubuntu -- bash -lc 'printf %s "$HOME"').Trim()
$resultPath = "$linuxHome/.local/share/zen-genome-studio/private/jobs/genome-preview/genome-preview.sqlite"
$resultUrl = "http://127.0.0.1:8080/result/index.html?dbpath=$([uri]::EscapeDataString($resultPath))"
Start-Process $resultUrl
