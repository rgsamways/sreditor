import spawn from 'cross-spawn';
import { join } from 'node:path';

function runGit(cwd: string, args: string[]): string | null {
  const result = spawn.sync('git', args, { cwd, encoding: 'utf-8' });
  if (result.error || result.status !== 0 || result.stdout === null) {
    return null;
  }
  return result.stdout;
}

export function findArchivingCommit(cwd: string, changeId: string): string | null {
  const archivePath = join('openspec', 'changes', 'archive', changeId).split('\\').join('/');
  const output = runGit(cwd, ['log', '--diff-filter=A', '--format=%H', '--', archivePath]);
  if (output === null) {
    return null;
  }

  const shas = output.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  return shas[0] ?? null;
}

/**
 * OpenSpec's own archive step commonly renames the draft folder (e.g.
 * "my-change") to a date-prefixed archive folder (e.g. "2026-07-27-my-change")
 * -- the two names don't match, so the draft path can't be guessed from
 * changeId alone. Uses git's rename detection on the archiving commit itself
 * to find what the archived proposal.md's path actually was before the move.
 */
function findRenamedFromPath(cwd: string, archivingCommitSha: string, changeId: string): string | null {
  const archivedProposalPath = `openspec/changes/archive/${changeId}/proposal.md`;
  const output = runGit(cwd, ['show', '-M', '--name-status', '--format=', archivingCommitSha]);
  if (output === null) {
    return null;
  }

  for (const line of output.split('\n')) {
    const [status, oldPath, newPath] = line.split('\t');
    if (status !== undefined && oldPath !== undefined && newPath !== undefined) {
      if (status.startsWith('R') && newPath === archivedProposalPath) {
        return oldPath;
      }
    }
  }
  return null;
}

export function findDraftCreationCommit(cwd: string, changeId: string, archivingCommitSha: string): string | null {
  const draftProposalPath =
    findRenamedFromPath(cwd, archivingCommitSha, changeId) ??
    join('openspec', 'changes', changeId, 'proposal.md').split('\\').join('/');

  const output = runGit(cwd, ['log', '--reverse', '--diff-filter=A', '--format=%H', '--', draftProposalPath]);
  if (output === null) {
    return null;
  }

  const shas = output.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  return shas[0] ?? null;
}

function isAncestor(cwd: string, ancestorSha: string, descendantSha: string): boolean {
  const result = spawn.sync('git', ['merge-base', '--is-ancestor', ancestorSha, descendantSha], {
    cwd,
    encoding: 'utf-8',
  });
  return !result.error && result.status === 0;
}

export function getChangedFilesInRange(cwd: string, fromRef: string, toRef: string): string[] {
  const output = runGit(cwd, ['diff', '--name-only', fromRef, toRef]);
  if (output === null) {
    return [];
  }

  return output.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
}

export interface ImplementationWindow {
  fromRef: string;
  toRef: string;
}

/**
 * Resolves the full commit range for a change: from just before its draft
 * proposal.md was first committed, through the commit that archived it --
 * not just the archiving commit alone, which for workflows spanning many
 * commits between implementing and archiving would otherwise only ever see
 * the final archive-folder move. Falls back to the archiving commit alone
 * when no draft commit is found, or when history has been rewritten such
 * that the draft commit isn't actually an ancestor of the archiving commit.
 */
export function resolveImplementationWindow(
  cwd: string,
  changeId: string,
  archivingCommitSha: string,
): ImplementationWindow {
  const draftCommitSha = findDraftCreationCommit(cwd, changeId, archivingCommitSha);
  if (draftCommitSha === null || !isAncestor(cwd, draftCommitSha, archivingCommitSha)) {
    return { fromRef: `${archivingCommitSha}^`, toRef: archivingCommitSha };
  }

  return { fromRef: `${draftCommitSha}^`, toRef: archivingCommitSha };
}
