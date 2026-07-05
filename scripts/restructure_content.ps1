# restructure_content.ps1
param(
  [string]$SourceDirs = "docs,templates",
  [string]$TargetDir = "content",
  [string]$BranchName = "chore/structure-content"
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "git 未安装"; exit 2 }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Warning "gh 未安装：将只推送分支但无法自动创建 PR" }

$root = (git rev-parse --show-toplevel) 2>$null
if (-not $root) { Write-Error "请在仓库内运行"; exit 2 }
Set-Location $root

$srcs = $SourceDirs.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
$toMove = @()
foreach ($s in $srcs) {
  if (Test-Path $s) {
    $files = Get-ChildItem -Path $s -Recurse -File -Include *.md
    $toMove += $files
  } else {
    Write-Host "源目录未找到： $s  （跳过）"
  }
}
if ($toMove.Count -eq 0) { Write-Host "没有找到要移动的 .md 文件，退出"; exit 0 }

Write-Host "将要移动的文件："
$toMove | ForEach-Object { Write-Host $_.FullName }

$yn = Read-Host "确认移动上述文件到 .\$TargetDir 吗？ (y/N)"
if ($yn -ne "y") { Write-Host "已取消"; exit 0 }

git fetch origin
git checkout -b $BranchName

foreach ($f in $toMove) {
  $rel = $f.FullName.Substring((Get-Location).Path.Length).TrimStart("\","/")
  $dest = Join-Path $TargetDir $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Move-Item -Path $f.FullName -Destination $dest -Force
  Write-Host "Moved: $rel -> $dest"
}

git add -A
git commit -m "chore: move templates/docs into content/ for QA scripts"
git push -u origin $BranchName

if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh pr create --title "Restructure: move docs/templates into content/" --body "Move .md templates to content/ to align with QA scripts." --base main --head $BranchName
  Write-Host "PR 已创建"
} else {
  Write-Host "已推送分支，请在 GitHub 上创建 PR： branch = $BranchName"
}
