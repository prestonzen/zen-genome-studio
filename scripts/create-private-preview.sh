#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/private-input.vcf.gz" >&2
  exit 2
fi

source_vcf="$1"
private_root="$HOME/.local/share/zen-genome-studio/private"
preview_vcf="$private_root/input/genome-preview.vcf"

if [[ ! -f "$source_vcf" ]]; then
  echo "Private source VCF was not found." >&2
  exit 1
fi

umask 077
mkdir -p "$(dirname "$preview_vcf")" "$private_root/jobs/genome-preview"

gzip -cd -- "$source_vcf" \
  | awk 'BEGIN { limit=100 } /^#/ { print; next } counts[$1] < limit { print; counts[$1]++ }' \
  > "$preview_vcf"

variant_count="$(grep -vc '^#' "$preview_vcf")"
chromosome_count="$(grep -v '^#' "$preview_vcf" | cut -f1 | sort -u | wc -l)"
preview_kb="$(( $(stat -c %s "$preview_vcf") / 1024 ))"

echo "Created a private local preview."
echo "Variants: $variant_count"
echo "Chromosomes/contigs: $chromosome_count"
echo "Size: ${preview_kb} KB"
