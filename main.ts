// Hand-in program for the gta6-cover-art-01 entry (Node 22, standard library
// only). The app itself is plain static files under app/ — index.html plus its
// scripts and styles, no build step, no network at run time. This program's
// only job is to assemble what the grader checks: it mirrors app/ and
// screenshots/ from this repository into the output directory and writes
// dossier.json there, using the vendored make.fun helper to summarise the
// files. When run outside the grader, MAKEFUN_OUTPUT_DIR stands in for the
// grader's /output directory, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: two runs over the same tree produce the
// same bytes, because it copies files as-is and the dossier is a pure
// function of those files.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), {
    recursive: true,
  });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
