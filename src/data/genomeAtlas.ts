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
        sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S1872497318302205',
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
    ],
  },
  {
    id: 'deep',
    title: 'Deep analysis',
    description: 'These are where the compressed FASTQ reads become useful beyond the existing VCF.',
    items: [
      { id: 'ancestry-atlas', title: 'Ancestry & haplogroups', status: 'Read pipeline', result: 'Population reference panel', detail: 'Global ancestry plus maternal and, where applicable, paternal lineages.', scale: 'Whole genome' },
      { id: 'sv-atlas', title: 'Structural variants', status: 'Read pipeline', result: 'Dedicated caller needed', detail: 'Searches for larger insertions, deletions, inversions, and copy-number changes.', scale: 'Whole genome' },
      { id: 'hla-atlas', title: 'HLA immune genes', status: 'Specialized', result: 'Specialized caller needed', detail: 'Highly variable immune genes need methods built specifically for this region.', scale: 'Targeted analysis' },
      { id: 'repeats-atlas', title: 'Repeat expansions', status: 'Specialized', result: 'Specialized caller needed', detail: 'Standard small-variant VCFs often miss expanded repeat sequences.', scale: 'Targeted analysis' },
    ],
  },
  {
    id: 'limits',
    title: 'Important limits',
    description: 'A responsible studio also shows where current genetics should stop.',
    items: [
      { id: 'personality-atlas', title: 'Personality', status: 'Not reliable', result: 'No individual prediction', detail: 'Current models are not useful for explaining a person from their genome.', scale: 'Complex trait' },
      { id: 'intelligence-atlas', title: 'Intelligence', status: 'Not reliable', result: 'Do not over-interpret', detail: 'Population associations do not justify an individual score or social conclusion.', scale: 'Highly polygenic' },
    ],
  },
]
