import { openSpecAdapter } from '../adapters/openspec.js';
import type { JudgmentRecord } from '../commands/judge.js';
import type { Project } from '../llm/rollup.js';
import { judgmentsFile } from '../paths.js';
import { readJsonl } from '../persistence/jsonl.js';
import {
  checkWordLimits,
  LINE_LABELS,
  orderChangeIdsByProximity,
  partitionProjects,
  PROXIMITY_LABELS,
  type WordLimitCheck,
} from '../report.js';
import { computeDateRange, latestJudgmentPerChange, readRollupOutput } from '../rollup.js';

export function getJudgmentsList(cwd: string): JudgmentRecord[] {
  return latestJudgmentPerChange(readJsonl<JudgmentRecord>(judgmentsFile(cwd)));
}

export function getJudgmentDetail(cwd: string, changeId: string): JudgmentRecord | null {
  return getJudgmentsList(cwd).find((record) => record.changeId === changeId) ?? null;
}

export interface JudgmentListItemView extends JudgmentRecord {
  // Set when this change, individually ineligible, is nonetheless a
  // contributing member of a genuine (filing-ready) rollup project -- the
  // whole point of the two-layer design, but invisible unless surfaced here.
  filingReadyProjectName: string | null;
}

function filingReadyProjectNameByChangeId(cwd: string): Map<string, string> {
  const rollupOutput = readRollupOutput(cwd);
  const map = new Map<string, string>();
  if (rollupOutput === null) {
    return map;
  }
  const { filingReady } = partitionProjects(rollupOutput);
  for (const project of filingReady) {
    for (const changeId of project.contributingChangeIds) {
      map.set(changeId, project.name);
    }
  }
  return map;
}

export function getJudgmentsListView(cwd: string): JudgmentListItemView[] {
  const projectNameByChangeId = filingReadyProjectNameByChangeId(cwd);
  return getJudgmentsList(cwd).map((record) => ({
    ...record,
    filingReadyProjectName: projectNameByChangeId.get(record.changeId) ?? null,
  }));
}

export function getJudgmentDetailView(cwd: string, changeId: string): JudgmentListItemView | null {
  return getJudgmentsListView(cwd).find((record) => record.changeId === changeId) ?? null;
}

export interface CoverageView {
  archivedCount: number;
  judgedCount: number;
  unjudgedCount: number;
  rolledUpCount: number;
  rollupExists: boolean;
}

export function getCoverage(cwd: string): CoverageView {
  const archivedCount = openSpecAdapter.isAvailable(cwd) ? openSpecAdapter.listChanges(cwd).length : 0;
  const judgedCount = getJudgmentsList(cwd).length;
  const rollupOutput = readRollupOutput(cwd);
  const rolledUpCount = rollupOutput === null ? 0 : new Set(rollupOutput.projects.flatMap((project) => project.contributingChangeIds)).size;

  return {
    archivedCount,
    judgedCount,
    unjudgedCount: Math.max(archivedCount - judgedCount, 0),
    rolledUpCount,
    rollupExists: rollupOutput !== null,
  };
}

export interface WordLimitCheckView extends WordLimitCheck {
  label: string;
}

export interface FilingReadyProjectView {
  name: string;
  contributingChangeIds: string[];
  confidence: Project['confidence'];
  dateRange: string;
  uncertainty: string;
  investigation: string;
  advancement: string;
  wordLimitChecks: WordLimitCheckView[];
}

export interface ExcludedChangeView {
  changeId: string;
  found: boolean;
  proximity: JudgmentRecord['proximity'] | null;
  proximityLabel: string | null;
  reasoning: string | null;
  pathToEligibility: string | null;
}

export interface ExcludedProjectView {
  name: string;
  dateRange: string;
  changes: ExcludedChangeView[];
}

export interface RollupView {
  rollupExists: boolean;
  generatedAt: string | null;
  filingReady: FilingReadyProjectView[];
  excluded: ExcludedProjectView[];
}

export function getRollupView(cwd: string): RollupView {
  const rollupOutput = readRollupOutput(cwd);
  if (rollupOutput === null) {
    return { rollupExists: false, generatedAt: null, filingReady: [], excluded: [] };
  }

  const recordsById = new Map(getJudgmentsList(cwd).map((record) => [record.changeId, record]));
  const dateRangeByProject = new Map(
    rollupOutput.projects.map((project) => {
      const contributing = project.contributingChangeIds
        .map((id) => recordsById.get(id))
        .filter((record): record is JudgmentRecord => record !== undefined);
      return [project, computeDateRange(contributing)] as const;
    }),
  );

  const { filingReady, excluded } = partitionProjects(rollupOutput);

  return {
    rollupExists: true,
    generatedAt: rollupOutput.generatedAt,
    filingReady: filingReady.map((project) => ({
      name: project.name,
      contributingChangeIds: project.contributingChangeIds,
      confidence: project.confidence,
      dateRange: dateRangeByProject.get(project) ?? 'unknown',
      uncertainty: project.uncertainty,
      investigation: project.investigation,
      advancement: project.advancement,
      wordLimitChecks: checkWordLimits(project).map((check) => ({ ...check, label: LINE_LABELS[check.field] })),
    })),
    excluded: excluded.map((project) => ({
      name: project.name,
      dateRange: dateRangeByProject.get(project) ?? 'unknown',
      changes: orderChangeIdsByProximity(project.contributingChangeIds, recordsById).map((changeId) => {
        const record = recordsById.get(changeId);
        return {
          changeId,
          found: record !== undefined,
          proximity: record?.proximity ?? null,
          proximityLabel: record?.proximity ? PROXIMITY_LABELS[record.proximity] : null,
          reasoning: record?.reasoning ?? null,
          pathToEligibility: record?.pathToEligibility ?? null,
        };
      }),
    })),
  };
}
