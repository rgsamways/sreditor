import { Command } from 'commander';
import { doctor } from './commands/doctor.js';
import { init } from './commands/init.js';
import { judge } from './commands/judge.js';
import { probe } from './commands/probe.js';
import { reflect } from './commands/reflect.js';
import { report } from './commands/report.js';
import { rollup } from './commands/rollup.js';
import { scan } from './commands/scan.js';
import { statsOff, statsOn, statsShow } from './commands/stats.js';
import { status } from './commands/status.js';

const program = new Command();

program
  .name('sreditor')
  .description('SR&ED-eligibility judgment CLI for OpenSpec-driven agentic coding workflows')
  .version('0.0.1');

program
  .command('scan')
  .description('List archived OpenSpec changes')
  .action(() => scan(process.cwd()));

program
  .command('status')
  .description('At-a-glance summary: archived changes, judged vs. unjudged, anchor state')
  .action(() => status(process.cwd()));

program
  .command('doctor')
  .description('Pre-flight check: API key, source detection, writable state directory')
  .action(() => doctor(process.cwd()));

program
  .command('init')
  .description('AI-assisted interview that drafts the anchor document')
  .action(() => runAsync(init(process.cwd())));

program
  .command('reflect')
  .description('Append a dated revision to the anchor document')
  .action(() => runAsync(reflect(process.cwd())));

program
  .command('probe')
  .description('Optional pre-implementation interview that captures a draft change\'s genuine uncertainty')
  .argument('<change-id>', 'Draft OpenSpec change id (the folder name under openspec/changes/)')
  .action((changeId: string) => runAsync(probe(process.cwd(), changeId)));

program
  .command('judge')
  .description('Judge unjudged archived changes (or one by id) against the CRA three-part test')
  .argument('[change-id]', 'Judge only this specific archived change, even if already judged')
  .action((changeId: string | undefined) => runAsync(judge(process.cwd(), changeId)));

program
  .command('rollup')
  .description('Group the judgment log into CRA-shaped projects (shows a cost estimate first)')
  .option('-y, --yes', 'Skip the cost-estimate confirmation prompt')
  .action((options: { yes?: boolean }) => runAsync(rollup(process.cwd(), options.yes ?? false)));

program
  .command('report')
  .description('Render the saved rollup as a T661-Part-2-structured markdown report')
  .action(() => report(process.cwd()));

const statsCommand = program
  .command('stats')
  .description('Manage opt-in, purely-aggregate usage statistics sharing (off by default)');

statsCommand
  .command('on')
  .description('Opt in to sharing aggregate usage stats -- prints the exact payload')
  .action(() => statsOn(process.cwd()));

statsCommand
  .command('off')
  .description('Opt out immediately -- nothing further is sent')
  .action(() => statsOff(process.cwd()));

statsCommand
  .command('show')
  .description('Print the exact payload that would be sent, without sending it')
  .action(() => statsShow(process.cwd()));

function runAsync(promise: Promise<void>): void {
  promise.catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

program.parse();
