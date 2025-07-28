/* eslint-disable no-console */
import { input, search } from '@inquirer/prompts';
import { makeProgram } from './program.ts';
import { inFileConfig, outFileConfig, mapFileConfig } from './prompts.ts';
import { getSymbol, S_STEP_ERROR } from './theme/symbols.ts';
import { colors } from './theme/colors.ts';

const program = makeProgram();

program.parse();

async function main() {
  try {
    const options = program.opts();

    const inFile = options.in ?? (await search(inFileConfig));
    const mapFile = options.map ?? (await search(mapFileConfig));
    const outFile = options.out ?? (await input(outFileConfig));

    const displayArgs = [
      '--in',
      inFile,
      '--map',
      mapFile,
      ...(outFile ? ['--out', outFile] : []),
    ];

    console.log('\nRunning:');
    console.log(`replace-text ${displayArgs.join(' ')}`);

    // await runReplaceText({ in: inFile, map: mapFile, out: outFile });
  } catch (err) {
    if (err instanceof Error && err.name === 'ExitPromptError') {
      const icon = getSymbol('error');
      console.error(`\n${icon} Action cancelled by user. Exiting. ${icon}\n`);
      process.exit(1);
    } else {
      console.error(
        `\n${colors.red(S_STEP_ERROR)} Unexpected error:`,
        err,
        '\n',
      );
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
