# apply_suggestions.ps1
# 用法:
#  .\apply_suggestions.ps1          -> 交互式执行（默认 branch 名）
#  .\apply_suggestions.ps1 -DryRun  -> 只打印将要替换的文件，不做提交
param(
  [switch]$DryRun,
  [string]$BranchName = "feat/apply-suggestions"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "git 未安装或不可用"; exit 2 }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Warning "gh CLI 未找到：脚本仍可运行但无法自动创建 PR" }

$root = (git rev-parse --show-toplevel) 2>$null
if (-not $root) { Write-Error "请在 git 仓库内运行该脚本"; exit 2 }
Set-Location $root

$suggestFiles = Get-ChildItem -Recurse -File -Filter "*.suggest.md" | Sort-Object FullName
if ($suggestFiles.Count -eq 0) { Write-Host "未发现任何 suggestions/*.suggest.md，退出"; exit 0 }

Write-Host "发现 $($suggestFiles.Count) 个建议文件:`n"
$suggestFiles | ForEach-Object { Write-Host $_.FullName }

if ($DryRun) {
  Write-Host "`nDryRun 模式：列出将要替换的原文件映射："
  foreach ($f in $suggestFiles) {
    $orig = $f.FullName -replace "\.suggest\.md$",".md"
    Write-Host "$($f.FullName) -> $orig"
  }
  exit 0
}

git fetch origin
git checkout -b $BranchName

foreach ($f in $suggestFiles) {
  $orig = $f.FullName -replace "\.suggest\.md$",".md"
  $dir = Split-Path $orig -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Copy-Item -Path $f.FullName -Destination $orig -Force
  Write-Host "Applied: $($f.FullName) -> $orig"
}

git add -A
$changes = git status --porcelain
if (-not $changes) {
  Write-Host "没有可提交的变更（可能已被手动合并），退出。"
  git checkout -
  exit 0
}

git commit -m "chore: apply auto-split suggestions (auto-generated) — please review"
git push -u origin $BranchName

if (Get-Command gh -ErrorAction SilentlyContinue) {
  $title = "Apply auto-split suggestions (please review)"
  $body = "This PR applies auto-generated split suggestions from suggestions/*.suggest.md. Please review changes before merging."
  gh pr create --title $title --body $body --base main --head $BranchName
  Write-Host "PR 已用 gh 创建（请在浏览器查看并复核）。"
} else {
  Write-Host "gh CLI 未安装，已推送分支。请在 GitHub 页面手动创建 PR： branch = $BranchName"
}
