import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function openSpecConfigExists(cwd: string): boolean {
  return existsSync(join(cwd, 'openspec', 'config.yaml'));
}

const CLAUDE_MD_MARKER = '## Sreditor';

export const CLAUDE_MD_SECTION = `${CLAUDE_MD_MARKER}

This project uses [Sreditor](https://github.com/rgsamways/sreditor) to capture SR&ED-eligible work as it happens, alongside the OpenSpec propose/apply/archive workflow:

- \`sreditor init\` -- run once, early, to record the project's stated goal, genuine technological uncertainty, and success criteria.
- \`sreditor probe <change-id>\` -- optional, before implementing a draft change that feels genuinely uncertain; captures the uncertainty and alternatives you're weighing.
- \`sreditor reflect\` -- append a dated revision to the anchor document as understanding evolves.
- \`sreditor judge\` / \`sreditor rollup\` / \`sreditor report\` -- run later, retrospectively, to judge archived changes and produce a T661-shaped report.
`;

export type ClaudeMdNoteResult = 'appended' | 'already-present' | 'no-claude-md';

export function writeClaudeMdNote(cwd: string): ClaudeMdNoteResult {
  const claudeMdPath = join(cwd, 'CLAUDE.md');
  if (!existsSync(claudeMdPath)) {
    return 'no-claude-md';
  }

  const existing = readFileSync(claudeMdPath, 'utf-8');
  if (existing.includes(CLAUDE_MD_MARKER)) {
    return 'already-present';
  }

  appendFileSync(claudeMdPath, `\n${CLAUDE_MD_SECTION}`, 'utf-8');
  return 'appended';
}
