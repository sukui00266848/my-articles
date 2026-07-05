# test_ci_pr.ps1
param(
  [string]$BranchName = "test/ci-check",
  [string]$Repo = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "git 未安装"; exit 2 }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Error "需要 gh CLI 来创建 PR 与下载 artifact"; exit 2 }

$root = (git rev-parse --show-toplevel) 2>$null
if (-not $root) { Write-Error "请在仓库内运行"; exit 2 }
Set-Location $root

git fetch origin
git checkout -b $BranchName
git commit --allow-empty -m "ci: test content-checks workflow"
git push -u origin $BranchName

$prTitle = "Test CI: generate sentence report artifact"
$prBody = "Trigger workflow to verify report generation and artifact upload."
gh pr create --title $prTitle --body $prBody --base main --head $BranchName

Write-Host "PR 已创建，等待 Actions 运行..."

$repoFull = if ($Repo -ne "") { $Repo } else { (git remote get-url origin).ToString() }
if ($repoFull -match "git@github.com:(.+/.*)\.git") { $repoFull = $matches[1] }
elseif ($repoFull -match "https://github.com/(.+/.*)(\.git)?") { $repoFull = $matches[1] }

Write-Host "等待 Actions 完成（最多 3 分钟）..."
Start-Sleep -Seconds 10

$runId = gh run list --repo $repoFull --branch $BranchName --workflow "Content Checks" --limit 5 --json databaseId --jq '.[0].databaseId' 2>$null
if (-not $runId) {
  $runId = gh run list --repo $repoFull --branch $BranchName --limit 1 --json databaseId --jq '.[0].databaseId'
}
if (-not $runId) { Write-Warning "未能找到 run id，请稍后在 GitHub Actions 页面检查"; exit 0 }

Write-Host "Found runId: $runId"

for ($i=0; $i -lt 12; $i++) {
  $status = gh run view $runId --repo $repoFull --json status --jq .status
  Write-Host "Run status: $status"
  if ($status -eq "completed") { break }
  Start-Sleep -Seconds 10
}

Write-Host "下载 artifacts for runId $runId ..."
$tempDir = Join-Path $env:TEMP "gh_artifact_$runId"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
gh run download $runId --repo $repoFull --dir $tempDir
if (Test-Path $tempDir) {
  Get-ChildItem -Recurse $tempDir | ForEach-Object { Write-Host $_.FullName }
  Write-Host "Artifacts 已下载到 $tempDir"
} else {
  Write-Warning "未找到 artifacts 或下载失败，请在 Actions 页面手动检查。"
}
