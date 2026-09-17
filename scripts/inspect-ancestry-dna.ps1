param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$ErrorActionPreference = 'Stop'
$resolved = (Resolve-Path -LiteralPath $Path).Path
$extension = [IO.Path]::GetExtension($resolved).ToLowerInvariant()
$stream = $null
$archive = $null
$reader = $null

try {
    if ($extension -eq '.zip') {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $archive = [IO.Compression.ZipFile]::OpenRead($resolved)
        $entry = $archive.Entries |
            Where-Object { $_.Name -match '(?i)\.(txt|csv)$' -and $_.Length -gt 0 } |
            Sort-Object Length -Descending |
            Select-Object -First 1
        if (-not $entry) { throw 'No text-format DNA export was found inside the archive.' }
        $stream = $entry.Open()
    } elseif ($extension -in @('.txt', '.csv')) {
        $stream = [IO.File]::OpenRead($resolved)
    } else {
        throw 'Expected an AncestryDNA .txt, .csv, or original .zip export.'
    }

    $reader = [IO.StreamReader]::new($stream)
    $rowCount = 0
    $rsidCount = 0
    $headerFound = $false
    $build = 'Not declared'

    while (-not $reader.EndOfStream) {
        $line = $reader.ReadLine()
        if ($line -match '(?i)build\s*(\d+)') { $build = "Build $($Matches[1])" }
        if ($line -match '^rsid[\t,]chromosome[\t,]position[\t,]allele1[\t,]allele2') {
            $headerFound = $true
            continue
        }
        if ($line -match '^rs\d+[\t,]') {
            $rowCount++
            $rsidCount++
        }
    }

    Write-Host 'Zen Genome Studio - AncestryDNA inspection'
    Write-Host '------------------------------------------'
    Write-Host "[format] $($extension.TrimStart('.').ToUpperInvariant()) source"
    Write-Host "[build]  $build"
    Write-Host "[header] $(if ($headerFound) { 'Recognized Ancestry-style columns' } else { 'No standard header detected' })"
    Write-Host ('[rows]   {0:N0} rsID genotype rows' -f $rsidCount)
    Write-Host '[safe]   No genotype values were printed, copied, or uploaded.'

    if (-not $headerFound -or $rowCount -eq 0) {
        Write-Host '[next]   This does not look like a standard AncestryDNA raw-data export.'
        exit 1
    }

    Write-Host '[ready]  The export can be added as a separate local data layer after strand/build harmonization.'
} finally {
    if ($reader) { $reader.Dispose() }
    elseif ($stream) { $stream.Dispose() }
    if ($archive) { $archive.Dispose() }
}
