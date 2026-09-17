#!/usr/bin/env bash
set -euo pipefail

VENV_DIR="$HOME/.venvs/opencravat"

echo "Preparing Ubuntu packages..."
sudo apt-get update
sudo apt-get install -y python3-venv python3-dev build-essential curl

echo "Creating an isolated OpenCRAVAT environment..."
mkdir -p "$HOME/.venvs"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip setuptools wheel
python -m pip install open-cravat

echo "Installing OpenCRAVAT base reference data (about 2 GB)..."
oc module install-base

modules=(
  clinvar
  clinvar_acmg
  gwas_catalog
  pharmgkb
  excelreporter
  tsvreporter
  wgclinvar
  wggwas_catalog
  wgpharmgkb
)

echo "Installing the starter clinical, trait, pharmacogenomic, and reporting modules..."
oc module install -y "${modules[@]}"

echo
echo "OpenCRAVAT is ready. Version:"
oc version
