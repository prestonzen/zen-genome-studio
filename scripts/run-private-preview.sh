#!/usr/bin/env bash
set -euo pipefail

venv_dir="$HOME/.venvs/opencravat"
private_root="$HOME/.local/share/zen-genome-studio/private"
preview_vcf="$private_root/input/genome-preview.vcf"
result_dir="$private_root/jobs/genome-preview"

if [[ ! -x "$venv_dir/bin/oc" ]]; then
  echo "OpenCRAVAT is not installed." >&2
  exit 1
fi

if [[ ! -f "$preview_vcf" ]]; then
  echo "Create the private preview VCF first." >&2
  exit 1
fi

umask 077
mkdir -p "$result_dir"
source "$venv_dir/bin/activate"

oc run "$preview_vcf" \
  -n genome-preview \
  -d "$result_dir" \
  -l hg38 \
  -a clinvar clinvar_acmg gwas_catalog pharmgkb \
  --mp 4 \
  --user-email-opt-out \
  -x

chmod 600 "$result_dir"/*
