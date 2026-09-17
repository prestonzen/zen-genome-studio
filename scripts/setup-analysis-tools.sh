#!/usr/bin/env bash
set -euo pipefail

echo 'Zen Genome Studio - optional analysis tools'
echo 'This installs local command-line tools inside your Ubuntu account. No genome file is uploaded.'
echo

mkdir -p "$HOME/.local/bin"
mkdir -p "$HOME/.local/share"
export PATH="$HOME/.local/bin:$PATH"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

if ! command -v micromamba >/dev/null 2>&1; then
  echo 'Adding the lightweight package installer...'
  curl -fsSL https://micro.mamba.pm/api/micromamba/linux-64/latest | tar -xj -C "$tmp_dir" bin/micromamba
  install -m 0755 "$tmp_dir/bin/micromamba" "$HOME/.local/bin/micromamba"
fi

tool_env="$HOME/.local/share/zen-genome-tools"
echo 'Installing the aligner, variant tools, and Java runtime...'
micromamba create -y -p "$tool_env" --channel-priority strict -c conda-forge -c bioconda minimap2 samtools bcftools openjdk=17
for tool in minimap2 samtools bcftools java; do
  ln -sf "$tool_env/bin/$tool" "$HOME/.local/bin/$tool"
done

if ! command -v genocat >/dev/null 2>&1 || ! command -v genounzip >/dev/null 2>&1; then
  echo 'Installing the free Genozip decompression tools...'
  curl -fsSL https://raw.githubusercontent.com/divonlan/genozip/master/installers/genozip-linux-x86_64.tar | tar -xJ -C "$tmp_dir"
  install -m 0755 "$tmp_dir"/genozip-linux-x86_64/genocat "$HOME/.local/bin/genocat"
  install -m 0755 "$tmp_dir"/genozip-linux-x86_64/genounzip "$HOME/.local/bin/genounzip"
  install -m 0755 "$tmp_dir"/genozip-linux-x86_64/genols "$HOME/.local/bin/genols"
fi

if ! command -v nextflow >/dev/null 2>&1; then
  echo 'Installing Nextflow for published genomics workflows...'
  (cd "$tmp_dir" && curl -fsSL https://get.nextflow.io | bash)
  install -m 0755 "$tmp_dir/nextflow" "$HOME/.local/bin/nextflow"
fi

if ! grep -qs 'HOME/.local/bin' "$HOME/.profile"; then
  printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$HOME/.profile"
fi

echo
echo 'Installed:'
for tool in genocat genounzip minimap2 samtools bcftools nextflow; do printf '  %-12s %s\n' "$tool" "$(command -v "$tool")"; done
echo
echo 'Setup complete. Return to Zen Genome Studio and select Check again.'
if [[ -t 0 ]]; then
  read -r -p 'Press Enter to close this window.' _
fi
