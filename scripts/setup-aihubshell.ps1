# aihubshell 설치 (Windows - WSL 필요)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Script = Join-Path $Root "scripts\setup-aihubshell.sh"

Write-Host "WSL에서 aihubshell 설치를 진행합니다..."
wsl bash -lc "cd '$(wsl wslpath -a $Root)' && bash scripts/setup-aihubshell.sh"
Write-Host "완료. .env.local에 AIHUB_API_KEY를 설정하세요."
