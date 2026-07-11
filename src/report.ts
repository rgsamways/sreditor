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

const LINE_LABELS: Record<ReportField, string> = {
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

export function renderReportMarkdown(rollupOutput: RollupOutput, dateRanges: string[]): string {
  const header = `# SR&ED Report\n\nGenerated from rollup dated ${rollupOutput.generatedAt}. Each section maps directly to CRA Form T661 Part 2.`;
  const projects = rollupOutput.projects
    .map((project, index) => renderProjectMarkdown(project, dateRanges[index] ?? 'unknown'))
    .join('\n\n---\n\n');

  return `${header}\n\n---\n\n${projects}\n`;
}
