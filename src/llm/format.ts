import type { ChangeArtifact } from '../adapters/types.js';

export function formatArtifact(artifact: ChangeArtifact): string {
  const fileNames = Object.keys(artifact.files);
  if (fileNames.length === 0) {
    return `Change "${artifact.id}" has no artifact files (proposal.md/design.md/tasks.md not found).`;
  }

  return Object.entries(artifact.files)
    .map(([name, content]) => `## ${name}\n\n${content}`)
    .join('\n\n');
}
