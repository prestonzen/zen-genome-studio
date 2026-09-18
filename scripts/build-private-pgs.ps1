$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envPath = Join-Path $projectRoot '.env.local'

function Get-LocalSetting([string]$name) {
    if (-not (Test-Path -LiteralPath $envPath)) { return $null }
    $line = Get-Content -LiteralPath $envPath | Where-Object { $_ -match "^$([regex]::Escape($name))=" } | Select-Object -First 1
    if (-not $line) { return $null }
    return ($line -split '=', 2)[1]
}

$dataDir = Get-LocalSetting 'GENOME_DATA_DIR'
$vcfName = Get-LocalSetting 'GENOME_VCF_NAME'
if (-not $dataDir -or -not $vcfName) { throw 'GENOME_DATA_DIR and GENOME_VCF_NAME must be configured in .env.local.' }

$privateRoot = Join-Path $env:LOCALAPPDATA 'ZenGenomeStudio\private'
$scoreRoot = Join-Path $privateRoot 'pgs-catalog'
$outputPath = Join-Path $privateRoot 'pgs-height-result.json'
$vcfPath = Join-Path $dataDir $vcfName

if (-not (Test-Path -LiteralPath $vcfPath)) { throw 'The configured VCF was not found.' }

$models = @(
    [pscustomobject]@{
        Id = 'PGS003895'
        Trait = 'Standing height'
        File = 'PGS003895_hmPOS_GRCh38.txt.gz'
        Url = 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/PGS003895/ScoringFiles/Harmonized/PGS003895_hmPOS_GRCh38.txt.gz'
    },
    [pscustomobject]@{
        Id = 'PGS002684'
        Trait = 'Chronotype (morning-person tendency)'
        File = 'PGS002684_hmPOS_GRCh38.txt.gz'
        Url = 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/PGS002684/ScoringFiles/Harmonized/PGS002684_hmPOS_GRCh38.txt.gz'
    },
    [pscustomobject]@{
        Id = 'PGS000027'
        Trait = 'Body mass index (BMI) tendency'
        File = 'PGS000027_hmPOS_GRCh38.txt.gz'
        Url = 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/PGS000027/ScoringFiles/Harmonized/PGS000027_hmPOS_GRCh38.txt.gz'
    }
)

New-Item -ItemType Directory -Force -Path $scoreRoot | Out-Null
$results = @()

foreach ($model in $models) {
    $scorePath = Join-Path $scoreRoot $model.File
    if (-not (Test-Path -LiteralPath $scorePath -PathType Leaf)) {
        Write-Host "Downloading public scoring weights for $($model.Id)..."
        $downloadPath = "$scorePath.download"
        try {
            Invoke-WebRequest -Uri $model.Url -OutFile $downloadPath -UseBasicParsing
            $stream = [IO.File]::OpenRead($downloadPath)
            try {
                if ($stream.ReadByte() -ne 0x1f -or $stream.ReadByte() -ne 0x8b) {
                    throw "The $($model.Id) download is not a gzip scoring file."
                }
            } finally {
                $stream.Dispose()
            }
            Move-Item -LiteralPath $downloadPath -Destination $scorePath -Force
        } finally {
            if (Test-Path -LiteralPath $downloadPath) { Remove-Item -LiteralPath $downloadPath -Force }
        }
    }

    $modelOutput = Join-Path $privateRoot "$($model.Id)-result.json"
    Write-Host "Calculating $($model.Trait) from explicitly reported variants..."
    node (Join-Path $PSScriptRoot 'build-private-pgs.mjs') --vcf $vcfPath --score $scorePath --output $modelOutput --model-id $model.Id --trait $model.Trait
    if ($LASTEXITCODE -ne 0) { throw "The $($model.Id) score could not be calculated." }
    $results += Get-Content -LiteralPath $modelOutput -Raw | ConvertFrom-Json
    Remove-Item -LiteralPath $modelOutput -Force
}

$height = $results | Where-Object { $_.modelId -eq 'PGS003895' } | Select-Object -First 1
if (-not $height) { throw 'The height score was not produced.' }
$height | Add-Member -NotePropertyName scores -NotePropertyValue $results -Force
$json = $height | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($outputPath, "$json`n", [Text.UTF8Encoding]::new($false))
Write-Host "Polygenic bundle refreshed with $($results.Count) locally calculated research scores."
