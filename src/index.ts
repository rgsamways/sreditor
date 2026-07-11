import { Command } from 'commander';
import { doctor } from './commands/doctor.js';
import { scan } from './commands/scan.js';
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

program.parse();
