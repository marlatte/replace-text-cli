import { Command } from 'commander';

export function makeProgram(options?: {
  exitOverride?: boolean;
  suppressOutput?: boolean;
}): Command {
  const program = new Command();

  // Configuration
  if (options?.exitOverride) {
    program.exitOverride();
  }
  if (options?.suppressOutput) {
    program.configureOutput({
      writeOut: () => {},
      writeErr: () => {},
    });
  }

  program
    .name('replace-text')
    .description('Replace text from a file using mapping rules')
    .option('-i, --in <file>', 'Input file to modify')
    .option('-m, --map <file>', 'Mapping file to use')
    .option(
      '-o, --out [file]',
      'Where to write the result (exclude [file] to overwrite)',
    )
    .option('-d, --dry-run', 'Simulate output without affecting files');

  return program;
}
