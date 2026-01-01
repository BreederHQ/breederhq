Write-Host "Stopping VS Code processes..."
Get-Process Code -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 2

Write-Host "Removing Claude Code local state from home directory..."
$claudePaths = @(
  "$HOME\.claude",
  "$HOME\.claude.json",
  "$HOME\.claude.json.backup"
)

foreach ($path in $claudePaths) {
  if (Test-Path $path) {
    Write-Host "Deleting $path"
    Remove-Item -Recurse -Force $path
  } else {
    Write-Host "Not found: $path"
  }
}

Write-Host "Checking for ANTHROPIC_API_KEY override..."
if (Get-ChildItem Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue) {
  Write-Host "Clearing ANTHROPIC_API_KEY"
  setx ANTHROPIC_API_KEY ""
} else {
  Write-Host "No ANTHROPIC_API_KEY set"
}

Write-Host ""
Write-Host "Claude Code state reset complete."
Write-Host "Next steps:"
Write-Host "1. Reopen VS Code"
Write-Host "2. Trigger Claude Code sign-in"
Write-Host "3. Carefully confirm the account email in the browser"
