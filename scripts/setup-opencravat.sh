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
  dbsnp
  gnomad4
  gwas_catalog
  pharmgkb
  revel
  sift
  polyphen2
  excelreporter
  tsvreporter
  wgclinvar
  wggwas_catalog
  wgpharmgkb
)

echo "Installing the starter clinical, population, trait, and reporting modules..."
for module in "${modules[@]}"; do
  oc module install "$module"
done

echo
echo "OpenCRAVAT is ready. Version:"
oc version

