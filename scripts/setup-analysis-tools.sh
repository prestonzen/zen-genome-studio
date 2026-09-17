#!/usr/bin/env bash
set -euo pipefail

echo 'Zen Genome Studio - optional analysis tools'
echo 'This installs local command-line tools inside Ubuntu. No genome file is uploaded.'
echo

sudo apt-get update
sudo apt-get install -y minimap2 samtools bcftools default-jre-headless curl xz-utils

mkdir -p "$HOME/.local/bin"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

echo 'Installing the free Genozip decompression tools...'
curl -fsSL https://raw.githubusercontent.com/divonlan/genozip/master/installers/genozip-linux-x86_64.tar | tar -xJ -C "$tmp_dir"
install -m 0755 "$tmp_dir"/genozip-linux-x86_64/genocat "$HOME/.local/bin/genocat"
install -m 0755 "$tmp_dir"/genozip-linux-x86_64/genounzip "$HOME/.local/bin/genounzip"
install -m 0755 "$tmp_dir"/genozip-linux-x86_64/genols "$HOME/.local/bin/genols"

echo 'Installing Nextflow for published genomics workflows...'
(cd "$tmp_dir" && curl -fsSL https://get.nextflow.io | bash)
install -m 0755 "$tmp_dir/nextflow" "$HOME/.local/bin/nextflow"

if ! grep -qs 'HOME/.local/bin' "$HOME/.profile"; then
  printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$HOME/.profile"
fi

export PATH="$HOME/.local/bin:$PATH"
echo
echo 'Installed:'
for tool in genocat genounzip minimap2 samtools bcftools nextflow; do printf '  %-12s %s\n' "$tool" "$(command -v "$tool")"; done
echo
echo 'Setup complete. Return to Zen Genome Studio and select Check again.'
read -r -p 'Press Enter to close this window.' _
