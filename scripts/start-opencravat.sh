#!/usr/bin/env bash
set -euo pipefail

VENV_DIR="$HOME/.venvs/opencravat"
STATE_DIR="$HOME/.local/state/preston-genome-studio"
PID_FILE="$STATE_DIR/opencravat.pid"
LOG_FILE="$STATE_DIR/opencravat.log"

if [[ ! -x "$VENV_DIR/bin/oc" ]]; then
  echo "OpenCRAVAT is not installed yet. Run the setup command first."
  exit 1
fi

mkdir -p "$STATE_DIR"

if [[ -f "$PID_FILE" ]] && kill -0 "$(<"$PID_FILE")" 2>/dev/null; then
  echo "OpenCRAVAT is already running."
  exit 0
fi

source "$VENV_DIR/bin/activate"
nohup oc gui >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
echo "OpenCRAVAT is starting at http://127.0.0.1:8080"

