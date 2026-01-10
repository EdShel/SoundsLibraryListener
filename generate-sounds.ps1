$soundsDir = "public\assets\sounds"
$outputFile = "src\sounds.ts"

if (-not (Test-Path $soundsDir)) {
  Write-Host "Error: $soundsDir directory not found"
  exit 1
}

$content = "export const soundFiles = [`n"

Get-ChildItem -Path $soundsDir -File | ForEach-Object {
  $content += "  '$($_.Name)',`n"
}

$content += "];"

$content | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "Generated $outputFile with sound files from $soundsDir"
