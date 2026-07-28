import spawn from 'cross-spawn';
import { existsSync } from 'node:fs';
import { isToolAvailable } from './detect.js';
import { findArchivingCommit, getChangedFilesInRange, resolveImplementationWindow } from './gitDiff.js';

export interface SccLanguageStats {
  name: string;
  files: number;
  lines: number;
  code: number;
  complexity: number;
}

export interface SemChange {
  entityType: string;
  entityName: string;
  changeType: string;
  filePath: string;
}

export interface SemSummary {
  fileCount: number;
  added: number;
  modified: number;
  deleted: number;
  changes: SemChange[];
}

export interface CorroboratingSignals {
  scc: SccLanguageStats[] | null;
  jscpd: string | null;
  sem: SemSummary | null;
}

function existingPaths(cwd: string, files: string[]): string[] {
  return files.filter((file) => existsSync(`${cwd}/${file}`));
}

function run(cwd: string, command: string, args: string[]): string | null {
  // Node's spawnSync default maxBuffer (1MB) is too small for sem's verbose
  // JSON output (includes full before/after content per changed entity) on
  // larger commits -- raise it rather than silently truncating real signal.
  const result = spawn.sync(command, args, { cwd, encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 });
  if (result.error || result.status !== 0 || result.stdout === null) {
    return null;
  }
  return result.stdout;
}

export function runScc(cwd: string, files: string[]): SccLanguageStats[] | null {
  if (!isToolAvailable('scc') || files.length === 0) {
    return null;
  }
  const output = run(cwd, 'scc', ['--format', 'json', ...files]);
  if (output === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(output) as {
      Name: string;
      Count: number;
      Lines: number;
      Code: number;
      Complexity: number;
    }[];
    return parsed.map((entry) => ({
      name: entry.Name,
      files: entry.Count,
      lines: entry.Lines,
      code: entry.Code,
      complexity: entry.Complexity,
    }));
  } catch {
    return null;
  }
}

const JSCPD_MAX_LINES = 30;
const EMOJI_LINE_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

export function runJscpd(cwd: string, files: string[]): string | null {
  if (!isToolAvailable('jscpd') || files.length === 0) {
    return null;
  }
  const output = run(cwd, 'jscpd', [...files, '--reporters', 'ai', '--no-colors']);
  if (output === null) {
    return null;
  }
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('time:') && !EMOJI_LINE_PATTERN.test(line));

  if (lines.length === 0) {
    return null;
  }
  const truncated = lines.length > JSCPD_MAX_LINES;
  const summary = lines.slice(0, JSCPD_MAX_LINES).join('\n');
  return truncated ? `${summary}\n(truncated -- ${lines.length - JSCPD_MAX_LINES} more clone pairs not shown)` : summary;
}

export function runSem(cwd: string, fromRef: string, toRef: string): SemSummary | null {
  if (!isToolAvailable('sem')) {
    return null;
  }
  const output = run(cwd, 'sem', ['diff', '--from', fromRef, '--to', toRef, '--format', 'json']);
  if (output === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(output) as {
      summary: { fileCount: number; added: number; modified: number; deleted: number };
      changes: { entityType: string; entityName: string; changeType: string; filePath: string }[];
    };
    return {
      fileCount: parsed.summary.fileCount,
      added: parsed.summary.added,
      modified: parsed.summary.modified,
      deleted: parsed.summary.deleted,
      changes: parsed.changes.map((change) => ({
        entityType: change.entityType,
        entityName: change.entityName,
        changeType: change.changeType,
        filePath: change.filePath,
      })),
    };
  } catch {
    return null;
  }
}

export function gatherCorroboratingSignals(cwd: string, changeId: string): CorroboratingSignals {
  const commitSha = findArchivingCommit(cwd, changeId);
  if (commitSha === null) {
    return { scc: null, jscpd: null, sem: null };
  }

  const { fromRef, toRef } = resolveImplementationWindow(cwd, changeId, commitSha);
  const files = existingPaths(cwd, getChangedFilesInRange(cwd, fromRef, toRef));

  return {
    scc: runScc(cwd, files),
    jscpd: runJscpd(cwd, files),
    sem: runSem(cwd, fromRef, toRef),
  };
}
