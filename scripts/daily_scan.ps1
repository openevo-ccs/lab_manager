# Wrapper for the Windows Scheduled Task — runs git_health.py's Tier 0 scan daily
# and logs to local/logs/ (gitignored) so a failure is visible without needing to
# watch it run. See docs/design-notes/ecosystem-cleanliness-and-maintenance-plan.md
# §4/§7 Phase 1 and §8 Open Decision 1.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot "local\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$logFile = Join-Path $logDir "scan_$timestamp.log"

Set-Location $repoRoot
try {
    $output = & python scripts\git_health.py 2>&1
    $output | Out-File -FilePath $logFile -Encoding utf8
    "Exit code: $LASTEXITCODE" | Out-File -FilePath $logFile -Append -Encoding utf8
} catch {
    "ERROR: $_" | Out-File -FilePath $logFile -Append -Encoding utf8
}

# Keep only the last 30 run logs so local/logs/ doesn't grow unbounded.
Get-ChildItem $logDir -Filter "scan_*.log" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item -Force
