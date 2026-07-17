import type { JudgmentRecord } from './commands/judge.js';
import type { Project } from './llm/rollup.js';
import type { RollupOutput } from './rollup.js';

export const WORD_LIMITS = {
  uncertainty: 350,
  investigation: 700,
  advancement: 350,
} as const;

export type ReportField = keyof typeof WORD_LIMITS;

export interface WordLimitCheck {
  field: ReportField;
  count: number;
  limit: number;
  overLimit: boolean;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function checkWordLimits(project: Project): WordLimitCheck[] {
  return (Object.keys(WORD_LIMITS) as ReportField[]).map((field) => {
    const count = countWords(project[field]);
    const limit = WORD_LIMITS[field];
    return { field, count, limit, overLimit: count > limit };
  });
}

export const LINE_LABELS: Record<ReportField, string> = {
  uncertainty: 'Line 242 — Technological Uncertainty',
  investigation: 'Line 244 — Work Performed',
  advancement: 'Line 246 — Technological Advancement',
};

function renderField(project: Project, check: WordLimitCheck): string {
  const warning = check.overLimit ? ` ⚠️ over limit, trim before filing` : '';
  return `### ${LINE_LABELS[check.field]} (${check.count}/${check.limit} words)${warning}\n\n${project[check.field]}`;
}

function renderProjectMarkdown(project: Project, dateRange: string): string {
  const checks = checkWordLimits(project);
  const fields = checks.map((check) => renderField(project, check)).join('\n\n');

  return [
    `## ${project.name}`,
    `**Date range:** ${dateRange} | **Confidence:** ${project.confidence} | **Contributing changes:** ${project.contributingChangeIds.join(', ')}`,
    '',
    fields,
  ].join('\n');
}

// Least eligible sorts last: a change with real (if incomplete) signal on multiple
// CRA prongs is worth a developer's attention before one with no signal at all.
const PROXIMITY_RANK: Record<JudgmentRecord['proximity'], number> = {
  close: 0,
  some_signal: 1,
  not_close: 2,
};

export const PROXIMITY_LABELS: Record<JudgmentRecord['proximity'], string> = {
  close: 'Close — multiple CRA prongs have real but incomplete signal',
  some_signal: 'Some signal — one CRA prong has real but incomplete signal',
  not_close: 'Not close — no genuine technical question described',
};

export function orderChangeIdsByProximity(changeIds: string[], recordsById: Map<string, JudgmentRecord>): string[] {
  return [...changeIds].sort((a, b) => {
    const rankA = PROXIMITY_RANK[recordsById.get(a)?.proximity ?? 'not_close'];
    const rankB = PROXIMITY_RANK[recordsById.get(b)?.proximity ?? 'not_close'];
    return rankA - rankB;
  });
}

const REJUDGE_HINT = 're-run `sreditor judge <change-id>` to populate this (judged before proximity/pathToEligibility existed)';

function renderExcludedChange(changeId: string, record: JudgmentRecord | undefined): string {
  if (!record) {
    return `**${changeId}**\n\nNo judgment record found for this change id.`;
  }
  const proximityLine = record.proximity ? `*Proximity: ${PROXIMITY_LABELS[record.proximity]}*` : `*Proximity: not available — ${REJUDGE_HINT}*`;
  const pathLine = record.pathToEligibility
    ? `**Path to eligibility (forward-looking):** ${record.pathToEligibility}`
    : `**Path to eligibility (forward-looking):** not available — ${REJUDGE_HINT}.`;

  return [`**${changeId}**`, proximityLine, record.reasoning, pathLine].join('\n\n');
}

function renderExcludedProject(project: Project, recordsById: Map<string, JudgmentRecord>): string {
  const sortedIds = orderChangeIdsByProximity(project.contributingChangeIds, recordsById);
  const changes = sortedIds.map((changeId) => renderExcludedChange(changeId, recordsById.get(changeId))).join('\n\n');

  return `### ${project.name}\n\n${changes}`;
}

export interface PartitionedProjects {
  filingReady: Project[];
  excluded: Project[];
}

export function partitionProjects(rollupOutput: RollupOutput): PartitionedProjects {
  return {
    filingReady: rollupOutput.projects.filter((project) => project.eligibleForFiling),
    excluded: rollupOutput.projects.filter((project) => !project.eligibleForFiling),
  };
}

export function renderReportMarkdown(rollupOutput: RollupOutput, dateRanges: string[], recordsById: Map<string, JudgmentRecord>): string {
  const header = `# SR&ED Report\n\nGenerated from rollup dated ${rollupOutput.generatedAt}. Each section maps directly to CRA Form T661 Part 2.`;

  const dateRangeByProject = new Map(rollupOutput.projects.map((project, index) => [project, dateRanges[index] ?? 'unknown'] as const));
  const { filingReady, excluded } = partitionProjects(rollupOutput);

  const projects = filingReady
    .map((project) => renderProjectMarkdown(project, dateRangeByProject.get(project) ?? 'unknown'))
    .join('\n\n---\n\n');

  const excludedSection =
    excluded.length === 0
      ? ''
      : `\n\n---\n\n## Excluded — not for filing\n\nThese groupings exist only to account for judged changes with no genuine SR&ED narrative. Do not copy into a CRA submission. Each change's own judgment reasoning is included below for transparency, ordered closest-to-eligible first, with forward-looking notes on what similar future work would need to document to qualify.\n\n${excluded.map((project) => renderExcludedProject(project, recordsById)).join('\n\n')}`;

  return `${header}\n\n---\n\n${projects}${excludedSection}\n`;
}
