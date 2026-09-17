#!/usr/bin/env bash
set -euo pipefail

VENV_DIR="$HOME/.venvs/opencravat"
STATE_DIR="$HOME/.local/state/preston-genome-studio"
PID_FILE="$STATE_DIR/opencravat.pid"
MODE="${1:-submit}"
PREVIEW_DB="$HOME/.local/share/zen-genome-studio/private/jobs/genome-preview/genome-preview.sqlite"

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
echo $$ >"$PID_FILE"

if [[ "$MODE" == "preview" ]]; then
  if [[ ! -f "$PREVIEW_DB" ]]; then
    echo "The private preview result does not exist yet." >&2
    rm -f -- "$PID_FILE"
    exit 1
  fi
  exec oc gui "$PREVIEW_DB" --headless --port 8080
fi

exec oc gui --headless --port 8080
