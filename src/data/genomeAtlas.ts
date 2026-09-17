import type { AtlasGroup } from '../types'

export const genomeAtlas: AtlasGroup[] = [
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Visible traits range from compact forensic models to highly polygenic estimates.',
    items: [
      {
        id: 'eye-atlas', title: 'Eye colour', status: 'Ready now', result: 'Six-marker IrisPlex model',
        detail: 'Useful probabilities for blue, intermediate, and brown eye colour.', scale: '6 markers',
        sourceUrl: 'https://hirisplex.erasmusmc.nl/',
      },
      {
        id: 'hair-atlas', title: 'Hair pigmentation', status: 'Ready now', result: 'Compact pigmentation panel',
        detail: 'MC1R and related markers provide a direction, not an exact shade.', scale: '6 markers',
        sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S1872497318302205',
      },
      {
        id: 'skin-atlas', title: 'Skin pigmentation', status: 'Full model', result: 'No skin category yet',
        detail: 'HIrisPlex-S needs its complete 36-marker model and population-aware interpretation.', scale: '36 markers',
        sourceUrl: 'https://nij.ojp.gov/library/publications/hirisplex-s-systemffor-eye-hair-and-skin-color-prediction-dna-introduction-and',
      },
      {
        id: 'freckling-atlas', title: 'Freckling & sun response', status: 'Ready now', result: 'Moderate pigmentation signal',
        detail: 'A small curated panel can shift the odds, but exposure and many additional variants matter.', scale: 'Curated markers',
        sourceUrl: 'https://hirisplex.erasmusmc.nl/',
      },
      {
        id: 'hair-shape-atlas', title: 'Hair shape & thickness', status: 'Full model', result: 'Research associations only',
        detail: 'EDAR and other loci contribute, but no compact model can reliably predict an individual hairstyle or texture.', scale: 'Polygenic',
        sourceUrl: 'https://www.ebi.ac.uk/gwas/',
      },
      {
        id: 'hair-loss-atlas', title: 'Pattern hair loss', status: 'Full model', result: 'No personal estimate yet',
        detail: 'Many autosomal and X-chromosome loci contribute, while age, hormones, medication, and health history remain essential context.', scale: 'Highly polygenic',
        sourceUrl: 'https://www.ebi.ac.uk/gwas/',
      },
      {
        id: 'height-atlas', title: 'Height', status: 'Full model', result: 'No estimate yet',
        detail: 'A calibrated polygenic score is required. A handful of height SNPs would be fake precision.', scale: '12,111+ variants',
        sourceUrl: 'https://www.nature.com/articles/s41586-022-05275-y',
      },
    ],
  },
  {
    id: 'senses',
    title: 'Senses & everyday biology',
    description: 'Some single markers shift the odds, but your lived experience remains the best check.',
    items: [
      { id: 'taste-atlas', title: 'Bitter taste', status: 'Ready now', result: 'Three-marker taste panel', detail: 'Estimates sensitivity to PTC-like bitter compounds.', scale: '3 markers' },
      { id: 'lactose-atlas', title: 'Lactose digestion', status: 'Ready now', result: 'Ancestry-sensitive marker', detail: 'A strong European-associated signal; other populations use different variants.', scale: '1 marker' },
      { id: 'cilantro-atlas', title: 'Cilantro perception', status: 'Ready now', result: 'Small olfactory signal', detail: 'One marker slightly shifts the chance that cilantro tastes soapy.', scale: '1 marker', sourceUrl: 'https://doi.org/10.1186/2044-7248-1-22' },
      { id: 'sneeze-atlas', title: 'Photic sneeze', status: 'Ready now', result: 'Odds-shifting marker', detail: 'A common marker changes the odds of sneezing in bright light; it does not decide the trait.', scale: '1 marker', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6428856/' },
      { id: 'earwax-atlas', title: 'Earwax type', status: 'Ready now', result: 'Large-effect ABCC11 marker', detail: 'One of the unusual everyday traits with a strong single-marker contribution.', scale: '1 marker', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16444273/' },
      { id: 'alcohol-atlas', title: 'Alcohol flush tendency', status: 'Ready now', result: 'ALDH2 marker available', detail: 'A large-effect marker can flag flushing tendency; it is not a safe-drinking score.', scale: '1 marker', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39075523/' },
      { id: 'caffeine-atlas', title: 'Caffeine response', status: 'Ready now', result: 'Metabolism and sensitivity clues', detail: 'CYP1A2 and ADORA2A offer modest context, while dose, sleep, hormones, and habits remain important.', scale: '2 markers', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4242593/' },
      { id: 'asparagus-atlas', title: 'Asparagus odour perception', status: 'Full model', result: 'Small smell-receptor association', detail: 'Variants near olfactory-receptor genes can shift whether asparagus metabolites are noticed, but the effect is not deterministic.', scale: 'Association panel', sourceUrl: 'https://www.ebi.ac.uk/gwas/' },
      { id: 'motion-atlas', title: 'Motion sickness tendency', status: 'Full model', result: 'Research associations available', detail: 'Common variants can shift susceptibility, but vehicle, visual cues, migraine history, age, and habituation have large effects.', scale: 'Polygenic', sourceUrl: 'https://www.ebi.ac.uk/gwas/' },
    ],
  },
  {
    id: 'polygenic',
    title: 'Polygenic models',
    description: 'Published scores combine many variants, but require matched ancestry, quality control, and calibration. Raw scores are not percentages. Temperature check, not destiny.',
    items: [
      { id: 'chronotype-atlas', title: 'Sleep chronotype', status: 'Full model', result: 'Published models available', detail: 'A score may shift morning-versus-evening tendency; schedule, light, age, and sleep debt often matter more.', scale: 'Many variants', sourceUrl: 'https://www.pgscatalog.org/' },
      { id: 'body-composition-atlas', title: 'Body composition', status: 'Full model', result: 'Model selection required', detail: 'Scores exist for BMI, fat distribution, and lean mass, but they do not prescribe diet or training.', scale: 'Many variants', sourceUrl: 'https://www.pgscatalog.org/' },
      { id: 'blood-traits-atlas', title: 'Blood-cell traits', status: 'Full model', result: 'Research scores available', detail: 'Counts and indices have published scores; a laboratory blood test remains the direct measurement.', scale: 'Many variants', sourceUrl: 'https://www.pgscatalog.org/' },
      { id: 'sleep-duration-atlas', title: 'Habitual sleep duration', status: 'Full model', result: 'Published scores available', detail: 'A score can estimate a small inherited tendency, but work schedule, light, stress, illness, and parenting commonly dominate actual sleep time.', scale: 'Many variants', sourceUrl: 'https://www.pgscatalog.org/' },
      { id: 'heart-rate-atlas', title: 'Resting heart rate', status: 'Full model', result: 'Research score available', detail: 'Genetic tendency is only one input; fitness, medication, illness, hydration, and the measured pulse are more actionable.', scale: 'Many variants', sourceUrl: 'https://www.pgscatalog.org/' },
      { id: 'grip-atlas', title: 'Grip strength', status: 'Full model', result: 'Research score available', detail: 'Polygenic scores explain only part of variation. Training, age, injury, body size, and measurement technique matter strongly.', scale: 'Many variants', sourceUrl: 'https://www.pgscatalog.org/' },
      { id: 'fitness-atlas', title: 'Athletic talent', status: 'Not reliable', result: 'No credible individual score', detail: 'Current genetics cannot rank overall talent, ideal sport, or the training program that will work best.', scale: 'Complex trait' },
    ],
  },
  {
    id: 'deep',
    title: 'Deep analysis',
    description: 'These are where the compressed FASTQ reads become useful beyond the existing VCF.',
    items: [
      { id: 'ancestry-atlas', title: 'Reference ancestry', status: 'Read pipeline', result: '1000 Genomes + PCA', detail: 'Reproducible broad genetic similarity against public populations, not cultural ethnicity or exact countries.', scale: 'Genome-wide SNPs', sourceUrl: 'https://www.internationalgenome.org/data-portal/data-collections/1000genomes_30x/' },
      { id: 'mtdna-atlas', title: 'Maternal haplogroup', status: 'Specialized', result: 'HaploGrep classification', detail: 'Uses mitochondrial variants to place the direct maternal line on a phylogenetic tree.', scale: 'Mitochondrial DNA', sourceUrl: 'https://haplogrep.readthedocs.io/en/latest/' },
      { id: 'ydna-atlas', title: 'Paternal haplogroup', status: 'Specialized', result: 'Yleaf classification', detail: 'For genomes with a Y chromosome, read evidence can resolve the direct paternal lineage.', scale: 'Y chromosome', sourceUrl: 'https://github.com/genid/Yleaf' },
      { id: 'sv-atlas', title: 'Structural variants & CNVs', status: 'Read pipeline', result: 'Manta-style caller needed', detail: 'Uses paired and split reads to find larger deletions, duplications, inversions, insertions, and copy-number changes.', scale: 'Mapped reads', sourceUrl: 'https://github.com/Illumina/manta' },
      { id: 'hla-atlas', title: 'HLA immune genes', status: 'Specialized', result: 'HLA*LA-style caller', detail: 'Highly variable immune genes need population-graph methods and mapped reads.', scale: 'Mapped reads', sourceUrl: 'https://github.com/DiltheyLab/HLA-LA' },
      { id: 'repeats-atlas', title: 'Repeat expansions', status: 'Specialized', result: 'ExpansionHunter-style caller', detail: 'Read realignment can estimate targeted repeat lengths that a small-variant VCF often misses.', scale: 'Mapped reads', sourceUrl: 'https://github.com/Illumina/ExpansionHunter' },
      { id: 'pharmcat-atlas', title: 'Medication response', status: 'Specialized', result: 'PharmCAT workflow', detail: 'Calls supported pharmacogene diplotypes and links them to CPIC, DPWG, and FDA guidance with explicit limitations.', scale: 'VCF + outside calls', sourceUrl: 'https://pharmcat.org/' },
      { id: 'blood-group-atlas', title: 'Blood groups', status: 'Specialized', result: 'RBCeq-style typing', detail: 'WGS can predict ABO, Rh, and many additional blood-group antigens; complex alleles still need careful validation.', scale: 'VCF + read depth', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/35033986/' },
      { id: 'nicotine-atlas', title: 'Nicotine metabolism', status: 'Specialized', result: 'CYP2A6 haplotype needed', detail: 'Copy-number changes and star alleles can influence nicotine clearance. A single consumer SNP is not enough for a reliable result.', scale: 'VCF + copy number', sourceUrl: 'https://www.pharmvar.org/gene/CYP2A6' },
      { id: 'archaic-atlas', title: 'Archaic-human segments', status: 'Specialized', result: 'Reference comparison needed', detail: 'Genome-wide comparison can estimate segments similar to published Neanderthal or Denisovan references; it is not a modern ethnicity percentage.', scale: 'Phased genome', sourceUrl: 'https://www.internationalgenome.org/' },
      { id: 'heteroplasmy-atlas', title: 'Mitochondrial heteroplasmy', status: 'Specialized', result: 'Read-level caller needed', detail: 'Raw-read depth can detect mixtures of mitochondrial alleles that a standard small-variant VCF may omit or simplify.', scale: 'Mitochondrial reads', sourceUrl: 'https://gatk.broadinstitute.org/hc/en-us/articles/360036717531-Mitochondrial-short-variant-discovery-SNVs-Indels' },
      { id: 'kinship-atlas', title: 'Kinship & shared DNA', status: 'Ready now', result: 'Parent-child pattern checked', detail: 'Genome-wide shared alleles can validate broad family relationships without using a relative as the subject genotype.', scale: 'Genome-wide SNPs', sourceUrl: 'https://www.cog-genomics.org/plink/2.0/distance' },
      { id: 'roh-atlas', title: 'Runs of homozygosity', status: 'Specialized', result: 'Population-aware QC needed', detail: 'Long homozygous segments can summarize parental relatedness and population history, but require careful thresholds.', scale: 'Genome-wide SNPs', sourceUrl: 'https://www.cog-genomics.org/plink/2.0/' },
    ],
  },
  {
    id: 'limits',
    title: 'Important limits',
    description: 'A responsible studio also shows where current genetics should stop.',
    items: [
      { id: 'personality-atlas', title: 'Personality', status: 'Not reliable', result: 'No individual prediction', detail: 'Current models are not useful for explaining a person from their genome.', scale: 'Complex trait' },
      { id: 'intelligence-atlas', title: 'Intelligence', status: 'Not reliable', result: 'Do not over-interpret', detail: 'Population associations do not justify an individual score or social conclusion.', scale: 'Highly polygenic' },
      { id: 'talent-atlas', title: 'Perfect diet or workout', status: 'Not reliable', result: 'No genome prescription', detail: 'Genetics may add small context, but cannot select a complete diet, supplement stack, or exercise plan.', scale: 'Environment-heavy' },
      { id: 'face-atlas', title: 'Exact face reconstruction', status: 'Not reliable', result: 'No responsible model', detail: 'Current models cannot recreate an identifiable face from an ordinary personal genome.', scale: 'Highly complex' },
      { id: 'age-atlas', title: 'Biological age from sequence', status: 'Not reliable', result: 'Needs epigenetic data', detail: 'DNA sequence is mostly stable through life. Common biological-age clocks use methylation or other measurements that FASTQ sequence alone does not contain.', scale: 'Different assay' },
      { id: 'handedness-atlas', title: 'Left or right handedness', status: 'Not reliable', result: 'No useful individual prediction', detail: 'Many tiny genetic effects and developmental factors contribute, so sequence data cannot responsibly predict an individual result.', scale: 'Very weak signal', sourceUrl: 'https://www.ebi.ac.uk/gwas/' },
    ],
  },
]
