import spawn from 'cross-spawn';

export function isToolAvailable(command: string): boolean {
  const result = spawn.sync(command, ['--version'], { stdio: 'ignore' });
  return !result.error && result.status === 0;
}
