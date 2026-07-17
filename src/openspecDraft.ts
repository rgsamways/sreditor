import { appendFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROBE_SECTION_HEADING = '## Articulated Uncertainty (probe)';

function draftChangeDir(cwd: string, changeId: string): string {
  return join(cwd, 'openspec', 'changes', changeId);
}

export function findDraftChange(cwd: string, changeId: string): string | null {
  const changeDir = draftChangeDir(cwd, changeId);
  if (!existsSync(changeDir) || !statSync(changeDir).isDirectory()) {
    return null;
  }
  const proposalPath = join(changeDir, 'proposal.md');
  if (!existsSync(proposalPath)) {
    return null;
  }
  return proposalPath;
}

export function readDraftProposal(cwd: string, changeId: string): string | null {
  const proposalPath = findDraftChange(cwd, changeId);
  if (proposalPath === null) {
    return null;
  }
  return readFileSync(proposalPath, 'utf-8');
}

export function appendProbeSection(cwd: string, changeId: string, body: string): void {
  const proposalPath = findDraftChange(cwd, changeId);
  if (proposalPath === null) {
    throw new Error(`No draft change found for "${changeId}".`);
  }
  const section = `${PROBE_SECTION_HEADING}\n\n${body.trim()}\n`;
  appendFileSync(proposalPath, `\n${section}`, 'utf-8');
}

export function hasExistingProbeSection(proposalText: string): boolean {
  return proposalText.includes(PROBE_SECTION_HEADING);
}
