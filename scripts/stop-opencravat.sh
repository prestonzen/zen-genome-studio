#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="$HOME/.local/state/preston-genome-studio"
PID_FILE="$STATE_DIR/opencravat.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "OpenCRAVAT is not running."
  exit 0
fi

process_id="$(<"$PID_FILE")"
if kill -0 "$process_id" 2>/dev/null; then
  kill "$process_id"
  echo "OpenCRAVAT stopped."
else
  echo "OpenCRAVAT was already stopped."
fi

rm -f -- "$PID_FILE"

