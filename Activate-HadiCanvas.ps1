#Requires -Version 5.1
param(
  [string]$ProjectPath = "",
  [switch]$InstallOnly,
  [switch]$StudioHint,
  [switch]$SkipGitPull,
  [int]$Port = 5173
)
$ErrorActionPreference = "Stop"
function Write-Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  !!  $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "  XX  $msg" -ForegroundColor Red }

if (-not $ProjectPath) {
  foreach ($c in @((Join-Path $HOME "Documents\hadi-canvas"), (Join-Path $PWD "hadi-canvas"), $PWD)) {
    if (Test-Path (Join-Path $c "package.json")) { $ProjectPath = $c; break }
  }
}
if (-not $ProjectPath -or -not (Test-Path (Join-Path $ProjectPath "package.json"))) {
  Write-Err "hadi-canvas پیدا نشد. -ProjectPath را مشخص کنید."
  exit 1
}
Set-Location $ProjectPath
Write-Step "پروه: $ProjectPath"

try { Write-Ok "node $(node -v) | npm $(npm -v)" } catch { Write-Err "Node.js نصب نیست"; exit 1 }

if (-not $SkipGitPull -and (Test-Path ".git")) {
  Write-Step "git pull"
  try { git pull --ff-only 2>&1 | Out-Host; Write-Ok "git" } catch { Write-Warn "git pull رد شد" }
}

Write-Step "پوشهها"
@(
  "src\data","src\connectors","src\github","src\prompts","src\templates","src\nodes",
  "src\components","src\hooks","src\engine","src\services","src\store","src\styles",".github\workflows"
) | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }
Write-Ok "dirs"

Write-Step "پچهای ZIP در Downloads/Documents"
$tmpRoot = Join-Path $env:TEMP "hadi-activate-patches"
New-Item -ItemType Directory -Force -Path $tmpRoot | Out-Null
$names = @(
  "hadi-studio-template.zip","hadi-connectors-marketplace.zip","hadi-missing-install.zip",
  "hadi-app-wire.zip","hadi-github-bus.zip","hadi-providers-panel.zip",
  "hadi-model-dropdown-patch.zip","hadi-canvas-complete.zip"
)
foreach ($name in $names) {
  $found = $null
  foreach ($root in @((Join-Path $HOME "Downloads"), (Join-Path $HOME "Documents"))) {
    $p = Join-Path $root $name
    if (Test-Path $p) { $found = $p; break }
  }
  if (-not $found) { continue }
  Write-Host "  apply $name"
  $dest = Join-Path $tmpRoot ([IO.Path]::GetFileNameWithoutExtension($name))
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  Expand-Archive -Path $found -DestinationPath $dest -Force
  Get-ChildItem -Path $dest -Recurse -Directory -Filter "src" -EA SilentlyContinue | ForEach-Object {
    Copy-Item (Join-Path $_.FullName "*") (Join-Path $ProjectPath "src") -Recurse -Force -EA SilentlyContinue
  }
}
Write-Ok "patches"

Write-Step "npm install"
npm install
if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed"; exit 1 }
$vc = Join-Path $ProjectPath "node_modules\.vite"
if (Test-Path $vc) { Remove-Item $vc -Recurse -Force -EA SilentlyContinue }

if ($InstallOnly) { Write-Ok "InstallOnly done"; exit 0 }

Write-Step "http://localhost:$Port/"
if ($StudioHint) {
  Write-Host "بعد از باز شدن: Ctrl+Shift+R | اتصالدهندهها | قالب استودیو" -ForegroundColor Yellow
}
npx vite --port $Port --force
