$ErrorActionPreference = "Stop"
$OLD = "C:\Users\almon\Downloads\caf-cae-standalone-dashboard-v11\caf-cae-standalone-dashboard-v11"
$HERE = Split-Path -Parent $MyInvocation.MyCommand.Path
$NEW = $HERE
if (-not (Test-Path "$NEW\frontend\v26-rebuild.js")) {
  $nested = Get-ChildItem $NEW -Directory | Where-Object { Test-Path "$($_.FullName)\frontend\v26-rebuild.js" } | Select-Object -First 1
  if ($nested) { $NEW = $nested.FullName }
}
if (-not (Test-Path "$NEW\frontend\v26-rebuild.js")) { throw "v37 frontend file not found in extracted package." }
Write-Host "SOURCE:" $NEW -ForegroundColor Cyan
Write-Host "TARGET:" $OLD -ForegroundColor Cyan
$check = Select-String -Path "$NEW\frontend\v26-rebuild.js" -Pattern "CAF CAE Pro v37|CAF_CAE_V37_RENDER"
if (-not $check) { throw "Source is not v37." }
robocopy "$NEW" "$OLD" /E /XD .git node_modules /XF .env | Out-Host
if ($LASTEXITCODE -gt 7) { throw "Robocopy failed with code $LASTEXITCODE" }
Set-Location $OLD
Write-Host "VERIFY COPIED FILE:" -ForegroundColor Yellow
Select-String -Path "frontend\v26-rebuild.js" -Pattern "CAF CAE Pro v37|CAF_CAE_V37_RENDER" | Out-Host
git status
git add -A
git commit -m "Install v37 live UI fix"
git pull --rebase origin main
git push origin main
Write-Host "DONE. Wait for Vercel Ready, then Ctrl+Shift+R." -ForegroundColor Green
