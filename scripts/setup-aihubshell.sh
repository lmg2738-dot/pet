# aihubshell 설치 (Linux / macOS / WSL)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/tools"
mkdir -p "$TOOLS"

echo "Downloading aihubshell..."
curl -fsSL -o "$TOOLS/aihubshell" "https://api.aihub.or.kr/api/aihubshell.do"
chmod +x "$TOOLS/aihubshell"

echo "Installed: $TOOLS/aihubshell"
echo "Set AIHUB_API_KEY in .env.local before use."
