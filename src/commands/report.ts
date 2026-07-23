import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { c } from '../cliUi.js';
import { checkWordLimits, renderReportMarkdown } from '../report.js';
import { judgmentsFile } from '../paths.js';
import { readJsonl } from '../persistence/jsonl.js';
import { computeDateRange, isRollupStale, latestJudgmentPerChange, readRollupOutput } from '../rollup.js';
import type { JudgmentRecord } from './judge.js';

export function report(cwd: string): void {
  const rollupOutput = readRollupOutput(cwd);
  if (rollupOutput === null) {
    console.error(c.red('No rollup found. Run `sreditor rollup` first.'));
    process.exitCode = 1;
    return;
  }

  const currentRecords = latestJudgmentPerChange(readJsonl<JudgmentRecord>(judgmentsFile(cwd)));
  const currentIds = new Set(currentRecords.map((record) => record.changeId));
  if (isRollupStale(rollupOutput, currentIds)) {
    console.log(
      c.yellow(
        'Warning: the judgment log has changed since this rollup was generated. Re-run `sreditor rollup` for an up-to-date report.',
      ),
    );
  }

  const recordsById = new Map(currentRecords.map((record) => [record.changeId, record]));
  const dateRanges = rollupOutput.projects.map((project) => {
    const contributing = project.contributingChangeIds
      .map((id) => recordsById.get(id))
      .filter((record): record is JudgmentRecord => record !== undefined);
    return computeDateRange(contributing);
  });

  const markdown = renderReportMarkdown(rollupOutput, dateRanges, recordsById);
  const today = new Date().toISOString().slice(0, 10);
  const outputPath = join(cwd, `sreditor-report-${today}.md`);
  writeFileSync(outputPath, markdown, 'utf-8');

  console.log(c.green(`Report written to ${outputPath}`));
  for (const project of rollupOutput.projects) {
    if (!project.eligibleForFiling) {
      console.log(c.yellow(`- ${project.name}: excluded from filing (not a genuine SR&ED narrative)`));
      continue;
    }
    const checks = checkWordLimits(project);
    const summary = checks
      .map((check) => `${check.field} ${check.count}/${check.limit}${check.overLimit ? c.red(' ⚠️') : ''}`)
      .join(', ');
    console.log(`- ${project.name}: ${summary}`);
  }
}
