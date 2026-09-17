# Trait Methodology

Zen Genome Studio's consumer report is intentionally small, local, and explainable. It is an educational interpretation layer, not a diagnostic test, ancestry estimate, fitness prescription, or substitute for observed traits.

## Evidence labels

| Label | Meaning |
| --- | --- |
| **Strong** | A validated multi-marker model or a marker with a large, repeatedly observed effect on the reported trait. |
| **Moderate** | A useful association with meaningful genetic support, but other genes, ancestry, environment, or behavior can materially change the outcome. |
| **Exploratory** | Interesting biology with limited predictive value for an individual. Never use this category to choose treatment, supplements, or training. |

The Discover screen starts in **Evidence first** mode. **Explore associations** is an explicit opt-in for low-predictive or early associations; it does not upgrade their evidence. A percentage is shown only when a published, validated model produces a calibrated probability. Marker coverage such as `2/6 direct` describes how much source evidence was directly observed, not how confident the prediction is.

## Included models

| Result | Method | Primary reference |
| --- | --- | --- |
| Eye colour | Six-marker IrisPlex multinomial model | [HIrisPlex-S tool](https://hirisplex.erasmusmc.nl/) and [forensic validation](https://pubmed.ncbi.nlm.nih.gov/24880832/) |
| Hair pigmentation / freckling | Compact MC1R and IRF4 marker panel; no exact hair-colour probability is claimed | [HIrisPlex-S validation](https://www.sciencedirect.com/science/article/pii/S1872497318302205) |
| Lactase persistence | `rs4988235`; the common European-associated regulatory signal | [Worldwide lactase-persistence alleles](https://pubmed.ncbi.nlm.nih.gov/29063188/) |
| Caffeine metabolism | `CYP1A2 rs762551` | [Caffeine genetics review](https://pmc.ncbi.nlm.nih.gov/articles/PMC4242593/) |
| Caffeine sensitivity | `ADORA2A rs5751876`; shown as exploratory | [Genotype and caffeine-response study](https://pmc.ncbi.nlm.nih.gov/articles/PMC6642114/) |
| Bitter taste | Three-marker `TAS2R38` panel | [Phenome-wide review](https://pubmed.ncbi.nlm.nih.gov/40498099/) |
| Earwax type | `ABCC11 rs17822931` | [Functional discovery study](https://pubmed.ncbi.nlm.nih.gov/16444273/) |
| Cilantro perception | `rs72921001` near an olfactory-receptor cluster; shown as exploratory because its individual effect is small | [Cilantro perception GWAS](https://doi.org/10.1186/2044-7248-1-22) |
| Alcohol flush marker | `ALDH2 rs671`; reports common reduced-activity status, never a safe-drinking score | [ALDH2 review](https://pubmed.ncbi.nlm.nih.gov/39075523/) |
| ACTN3 status | `ACTN3 rs1815739`; biological status is reported, athletic prediction is not | [Performance-genetics review](https://pubmed.ncbi.nlm.nih.gov/23681449/) |
| Bright-light sneeze reflex | `rs10427255`; an odds-shifting association shown as exploratory | [Photic sneeze GWAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC6428856/) |

## Atlas models that are not calculated yet

| Trait | Why the studio waits |
| --- | --- |
| Skin pigmentation | HIrisPlex-S uses a validated 36-marker model. The current compact pigmentation panel is not a substitute for that classifier. |
| Height | Height is highly polygenic. A 5.4-million-person study identified 12,111 independent associated variants, and an individual estimate still needs validated score weights, strand/build harmonization, and ancestry-aware calibration. |
| Ancestry and haplogroups | These require population reference panels and dedicated mitochondrial/Y-chromosome methods rather than a few hand-picked markers. |
| Structural variants, HLA, repeat expansions | These need read-level or specialized callers and cannot be reconstructed responsibly from a compact trait panel. |

The studio's first downloadable height definition is PGS Catalog `PGS003895`, harmonized to GRCh38. Downloading its 62,419 public weights does not calculate a personal score. Calculation requires complete callable genotypes, local allele matching, and coverage checks; interpretation additionally requires a relevant reference distribution. The configured variant-only WGS VCF cannot prove reference genotypes at omitted sites, and the official `pgsc_calc` workflow currently labels WGS input unsupported. Until all stages are complete, the interface reports model readiness rather than a height estimate or percentile.

## Variant-only VCF limitation

The configured WGS file stores variant calls rather than every genomic position. When a curated marker is absent, the first report treats it as **presumed reference**, not as a directly observed homozygous-reference call. This is common for a variant-only VCF but is not equivalent to inspecting read coverage at that site.

The UI reports how many markers were directly observed and how many were presumed reference. Important or surprising results should be confirmed against a callable gVCF, BAM/CRAM, or the original reads with an appropriate quality check.

## Whole genome, exome, and carrier testing

- A carrier test checks a selected set of variants or genes for a specific inherited-condition question.
- An exome focuses on protein-coding exons, roughly 1–2% of the genome. It is efficient for many rare coding disorders but usually does not cover the wider regulatory genome.
- Whole-genome sequencing retains evidence across coding and non-coding regions. Its raw reads can be reprocessed for small variants and specialized analyses such as structural variants, mitochondrial variation, HLA, and repeat expansions.

Raw FASTQ does not produce meaning by itself. A “full-gene check” still needs alignment, coverage review, an appropriate variant caller, quality thresholds, and expert interpretation. Short-read sequencing also remains difficult in repetitive and highly complex regions.

## What is intentionally excluded

- Disease risk, carrier status, and incidental findings. Those belong in a clinician-reviewed report.
- Intelligence, personality, attractiveness, or behavioral predictions.
- Training plans, supplement doses, or nutrition prescriptions based on a single marker.
- Skin-colour classification or genetic ancestry labels without the required validated model and reference panels.
- Large polygenic scores without ancestry-matched validation and proper score harmonization.

## Privacy boundary

The builder reads the configured VCF locally and writes a compact JSON report under the user's private app-data directory. It does not store the sample identifier, source path, or full genotype list. Cloudflare receives no VCF and serves fictional reference content only.
