# Contributing

Thanks for helping improve Genome Studio.

## Protect genetic privacy

Never attach or commit real genomic data, analysis results, screenshots of personal findings, sample identifiers, or private file paths. Use fictional examples when reporting a bug. If a report cannot be made anonymous, do not open a public issue.

Blocked file types include VCF, BCF, BAM, CRAM, FASTQ, Genozip, and OpenCRAVAT database files. Pull requests run an automated privacy check in addition to the normal lint and build checks.

## Make a change

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm ci`.
3. Run `npm run lint` and `npm run build`.
4. Describe the behavior and testing in the pull request without including private genomic information.

By contributing, you agree that your contribution is licensed under the MIT License.
