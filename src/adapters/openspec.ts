import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ChangeArtifact, SourceAdapter } from './types.js';

const ARCHIVE_RELATIVE_PATH = join('openspec', 'changes', 'archive');
const ARTIFACT_FILES = ['proposal.md', 'design.md', 'tasks.md'];

function archiveDir(cwd: string): string {
  return join(cwd, ARCHIVE_RELATIVE_PATH);
}

export const openSpecAdapter: SourceAdapter = {
  name: 'openspec',

  isAvailable(cwd: string): boolean {
    const dir = archiveDir(cwd);
    return existsSync(dir) && statSync(dir).isDirectory();
  },

  listChanges(cwd: string): ChangeArtifact[] {
    const dir = archiveDir(cwd);
    if (!existsSync(dir)) {
      return [];
    }

    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const changePath = join(dir, entry.name);
        const files: Record<string, string> = {};

        for (const fileName of ARTIFACT_FILES) {
          const filePath = join(changePath, fileName);
          if (existsSync(filePath)) {
            files[fileName] = readFileSync(filePath, 'utf-8');
          }
        }

        return { id: entry.name, path: changePath, files };
      });
  },
};
