export interface ChangeArtifact {
  /** The archived change's folder name, used as a stable identifier. */
  id: string;
  /** Absolute path to the change's folder. */
  path: string;
  /** Filename -> raw text content, e.g. { "proposal.md": "..." }. */
  files: Record<string, string>;
}

export interface SourceAdapter {
  name: string;
  /** Whether this project appears to use this source type. */
  isAvailable(cwd: string): boolean;
  /** Enumerate archived/completed change artifacts. */
  listChanges(cwd: string): ChangeArtifact[];
}
