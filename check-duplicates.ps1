$content = Get-Content "$PSScriptRoot\public\locales\en\translation.json"
$keys = @{}
$duplicates = @()
$lineNumber = 0

foreach($line in $content) {
    $lineNumber++
    if($line -match '\"([^\"]+)\"\s*:') {
        $key = $matches[1]
        if($keys.ContainsKey($key)) {
            $duplicates += @{
                Key = $key
                FirstLine = $keys[$key]
                DuplicateLine = $lineNumber
            }
        } else {
            $keys[$key] = $lineNumber
        }
    }
}

if($duplicates.Count -gt 0) {
    Write-Output "Found duplicate keys:"
    $duplicates | ForEach-Object {
        Write-Output "Key: $($_.Key) at lines $($_.FirstLine) and $($_.DuplicateLine)"
    }
} else {
    Write-Output "No duplicate keys found"
}
