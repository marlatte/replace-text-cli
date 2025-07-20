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
    .description('Replace text in a file using mapping rules')
    .option('--in <file>', 'Input file to modify')
    .option('--using <file>', 'Mapping file to use')
    .option(
      '--out <file>',
      'Where to write the result (leave blank to overwrite)',
    );

  return program;
}
