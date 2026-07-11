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

export function getChangedFiles(cwd: string, commitSha: string): string[] {
  const output = runGit(cwd, ['diff', '--name-only', `${commitSha}^`, commitSha]);
  if (output === null) {
    return [];
  }

  return output.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
}
