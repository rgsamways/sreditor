import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findArchivingCommit, getChangedFiles } from '../../src/tools/gitDiff.js';

let dir: string;

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf-8' });
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-gitdiff-'));
  git(['init', '-q']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);

  writeFileSync(join(dir, 'README.md'), '# test repo\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'initial commit']);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('findArchivingCommit', () => {
  it('finds the commit that added an archive folder', () => {
    mkdirSync(join(dir, 'openspec', 'changes', 'archive', 'my-change'), { recursive: true });
    writeFileSync(join(dir, 'openspec', 'changes', 'archive', 'my-change', 'proposal.md'), '## Why\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'archive my-change']);

    const expectedSha = git(['rev-parse', 'HEAD']).trim();
    expect(findArchivingCommit(dir, 'my-change')).toBe(expectedSha);
  });

  it('returns null for a change that was never committed', () => {
    expect(findArchivingCommit(dir, 'nonexistent-change')).toBeNull();
  });
});

describe('getChangedFiles', () => {
  it('lists the files changed in a commit', () => {
    writeFileSync(join(dir, 'src.ts'), 'export const x = 1;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'add src.ts']);

    const sha = git(['rev-parse', 'HEAD']).trim();
    expect(getChangedFiles(dir, sha)).toEqual(['src.ts']);
  });

  it('returns an empty array for a commit with no parent', () => {
    const rootSha = git(['rev-list', '--max-parents=0', 'HEAD']).trim();
    expect(getChangedFiles(dir, rootSha)).toEqual([]);
  });
});
