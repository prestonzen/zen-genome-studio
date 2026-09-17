# Genome Discovery Source Map

Zen Genome Studio separates what is technically callable from what is personally predictive. A published association is not automatically a useful result.

## Evidence tiers

| Tier | Studio wording | Requirement | Examples |
| --- | --- | --- | --- |
| A | Ready now | Validated compact model or unusually large-effect marker, with the required calls present | IrisPlex eye colour, ABCC11 earwax, ALDH2 flushing marker |
| B | Full model | Published weighted model, complete allele matching, ancestry-aware calibration, and an appropriate comparison distribution | Height, chronotype, blood-cell traits |
| C | Specialized | A domain caller must inspect mapped read evidence or complex haplotypes | HLA, repeat expansions, structural variants, blood groups, some pharmacogenes |
| D | Not reliable | No model supports an honest individual prediction | Personality, exact face, intelligence, ideal sport, perfect diet or workout |

## Reputable open sources

| Purpose | Source | How it belongs in the studio |
| --- | --- | --- |
| Broad genetic ancestry | [1000 Genomes 30x on GRCh38](https://www.internationalgenome.org/data-portal/data-collections/1000genomes_30x/) | Local reference panel for PCA and coarse similarity, never a culture or nationality label |
| Population structure | [PLINK 2 population stratification](https://www.cog-genomics.org/plink/2.0/strat) | QC, LD pruning, PCA, relatedness, and reproducible output files |
| Published polygenic scores | [PGS Catalog](https://www.pgscatalog.org/) | Metadata API plus downloadable scoring files; score only after build, allele, ancestry, and performance checks |
| Published associations | [NHGRI-EBI GWAS Catalog](https://www.ebi.ac.uk/gwas/) | Discovery and evidence lookup, not a source of uncalibrated personal percentages |
| Eye, hair, and skin models | [HIrisPlex-S validation](https://nij.ojp.gov/library/publications/hirisplex-s-systemffor-eye-hair-and-skin-color-prediction-dna-introduction-and) | Complete published marker models with their original output categories |
| Pharmacogenomics | [PharmCAT](https://pharmcat.org/) | Local GRCh38 workflow; specialized outside calls remain necessary for genes such as CYP2D6 and HLA |
| Maternal lineage | [HaploGrep 3](https://haplogrep.readthedocs.io/en/latest/) | Local mtDNA haplogroup classification with quality metrics |
| Paternal lineage | [Yleaf](https://github.com/genid/Yleaf) | Local Y-chromosome haplogroup inference when a Y chromosome is present |
| Structural variants | [Manta](https://github.com/Illumina/manta) | Paired- and split-read evidence from an indexed BAM or CRAM |
| HLA typing | [HLA*LA](https://github.com/DiltheyLab/HLA-LA) | Population-reference graph typing from indexed mapped reads |
| Repeat expansions | [ExpansionHunter](https://github.com/Illumina/ExpansionHunter) | Targeted repeat genotyping from PCR-free WGS reads; not a genome-wide guarantee |
| Blood groups | [RBCeq validation](https://pubmed.ncbi.nlm.nih.gov/35033986/) | Predicted ABO, Rh, and extended antigens with explicit validation limits |

## What FASTQ adds

FASTQ is not a larger trait spreadsheet. It is the original read evidence. After alignment to the same reference build, it can recover signals that an ordinary SNV/indel VCF may omit:

- split and discordant read pairs for structural variants;
- depth changes for copy-number variation;
- repeat-spanning, flanking, and in-repeat reads;
- complex HLA and pharmacogene haplotypes;
- mitochondrial heteroplasmy and lineage evidence;
- Y-chromosome lineage markers;
- quality checks at any reported variant.

For ordinary SNP-based traits and most polygenic scores, a high-quality normalized VCF or PGEN is already the useful input. Re-reading FASTQ does not create stronger science when the model itself is weak.

## Guardrails

- Never turn a GWAS hit into a percentage unless the published model outputs a calibrated probability.
- Never compare a raw PGS across ancestry groups without a justified reference distribution.
- Show model ancestry, evaluation ancestry, genome build, matched-variant rate, and missingness beside every score.
- Keep imported consumer estimates separate from open-reference ancestry calculations.
- Treat read-level medical findings as research output until an appropriate laboratory or clinician confirms them.
- Keep raw DNA, reports, and personal summaries outside the public repository and cloud preview.
