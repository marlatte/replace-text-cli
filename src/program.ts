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
    .description('Replace text from a file using a rules map.')
    .option('-i, --in <file>', 'Input file to modify / copy')
    .option(
      '-m, --map <file>',
      'Mapping file with .txt extension and arrow rules: input => output',
    )
    .option('-o, --out [file]', 'Output file (omit value to force overwrite)')
    .option('-d, --dry-run', 'Simulate output without affecting files');

  return program;
}
