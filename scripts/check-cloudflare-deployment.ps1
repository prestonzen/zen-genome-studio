param(
  [string]$BaseUrl = 'https://dna.prestonzen.com'
)

$ErrorActionPreference = 'Stop'

function Stop-Check([string]$Message) {
  Write-Host "ERROR: $Message" -ForegroundColor Red
  exit 1
}

$endpoint = "$($BaseUrl.TrimEnd('/'))/api/auth/status"
try {
  $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing
} catch {
  Stop-Check "The deployment status endpoint could not be reached at $endpoint. $($_.Exception.Message)"
}
$contentType = [string]$response.Headers.'Content-Type'

if ([int]$response.StatusCode -ne 200 -or $contentType -notmatch '^application/json') {
  Stop-Check "Pages Functions are not active at $BaseUrl. Deploy from the project folder with 'npm run deploy:cloudflare'; dashboard drag-and-drop uploads only the static site."
}

$payload = $response.Content | ConvertFrom-Json
if ($null -eq $payload.enabled -or $null -eq $payload.authenticated) {
  Stop-Check 'The authentication status endpoint returned an unexpected response.'
}

$mode = if ([bool]$payload.enabled) { 'password protected' } else { 'public demo' }
Write-Host "Cloudflare Pages Functions are active. Deployment mode: $mode."
Write-Host "Next, sign in through the site and confirm the provenance banner says either DEMO DATA or PRIVATE REPORT SYNC LOADED."
