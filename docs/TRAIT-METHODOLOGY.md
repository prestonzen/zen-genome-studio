# Trait Methodology

Zen Genome Studio's consumer report is intentionally small, local, and explainable. It is an educational interpretation layer, not a diagnostic test, ancestry estimate, fitness prescription, or substitute for observed traits.

## Evidence labels

| Label | Meaning |
| --- | --- |
| **Strong** | A validated multi-marker model or a marker with a large, repeatedly observed effect on the reported trait. |
| **Moderate** | A useful association with meaningful genetic support, but other genes, ancestry, environment, or behavior can materially change the outcome. |
| **Exploratory** | Interesting biology with limited predictive value for an individual. Never use this category to choose treatment, supplements, or training. |

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
| ACTN3 status | `ACTN3 rs1815739`; biological status is reported, athletic prediction is not | [Performance-genetics review](https://pubmed.ncbi.nlm.nih.gov/23681449/) |

## Variant-only VCF limitation

The configured WGS file stores variant calls rather than every genomic position. When a curated marker is absent, the first report treats it as **presumed reference**, not as a directly observed homozygous-reference call. This is common for a variant-only VCF but is not equivalent to inspecting read coverage at that site.

The UI reports how many markers were directly observed and how many were presumed reference. Important or surprising results should be confirmed against a callable gVCF, BAM/CRAM, or the original reads with an appropriate quality check.

## What is intentionally excluded

- Disease risk, carrier status, and incidental findings. Those belong in a clinician-reviewed report.
- Intelligence, personality, attractiveness, or behavioral predictions.
- Training plans, supplement doses, or nutrition prescriptions based on a single marker.
- Skin-colour classification or genetic ancestry labels.
- Large polygenic scores without ancestry-matched validation and proper score harmonization.

## Privacy boundary

The builder reads the configured VCF locally and writes a compact JSON report under the user's private app-data directory. It does not store the sample identifier, source path, or full genotype list. Cloudflare receives no VCF and serves fictional reference content only.
