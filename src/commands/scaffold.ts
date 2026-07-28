import * as clack from '@clack/prompts';
import spawn from 'cross-spawn';
import { startInterview } from '../interview.js';
import { CLAUDE_MD_SECTION, openSpecConfigExists, writeClaudeMdNote } from '../scaffold.js';
import { init } from './init.js';

export async function scaffold(cwd: string): Promise<void> {
  clack.intro('sreditor scaffold');

  if (openSpecConfigExists(cwd)) {
    clack.log.info('OpenSpec project already detected -- skipping `openspec init`.');
  } else {
    clack.log.step('No OpenSpec project detected -- running `openspec init`...');
    const result = spawn.sync('npx', ['-y', '@fission-ai/openspec@latest', 'init'], { cwd, stdio: 'inherit' });

    if (result.error || result.status !== 0 || !openSpecConfigExists(cwd)) {
      clack.log.error('`openspec init` did not complete. Run it yourself, then re-run `sreditor scaffold`.');
      process.exitCode = 1;
      clack.outro('Not scaffolded.');
      return;
    }
  }

  const noteResult = writeClaudeMdNote(cwd);
  if (noteResult === 'appended') {
    clack.log.success('Appended a Sreditor usage note to CLAUDE.md.');
  } else if (noteResult === 'already-present') {
    clack.log.info('CLAUDE.md already has a Sreditor section -- leaving it as-is.');
  } else {
    clack.note(CLAUDE_MD_SECTION, 'No CLAUDE.md found -- save this note yourself');
  }

  const interview = startInterview();
  const runInit = await interview.confirm('Run `sreditor init` now to record your anchor document?');
  interview.close();

  if (runInit) {
    await init(cwd);
    return;
  }

  clack.outro("Scaffolding complete. Run `sreditor init` whenever you're ready.");
}
