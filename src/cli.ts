import { input } from '@inquirer/prompts';
import { makeProgram } from './program.ts';
import {
  inFileQuestion,
  outFileQuestion,
  usingFileQuestion,
} from './inquire.ts';
import { getSymbol, S_STEP_ERROR } from './theme/symbols.ts';
import { colors } from './theme/colors.ts';

const program = makeProgram();

program.parse();

async function main() {
  try {
    const options = program.opts();

    const inFile = options.in ?? (await input(inFileQuestion));
    const usingFile = options.using ?? (await input(usingFileQuestion));
    const outFile = options.out ?? (await input(outFileQuestion));

    const displayArgs = [
      '--in',
      inFile,
      '--using',
      usingFile,
      ...(outFile ? ['--out', outFile] : []),
    ];

    console.log('\nRunning:');
    console.log(`replace-text ${displayArgs.join(' ')}`);

    throw new Error('Intentional');
  } catch (err) {
    if (err instanceof Error && err.name === 'ExitPromptError') {
      console.error(
        `\n${getSymbol('error')} Action cancelled by user. Exiting.\n`,
      );
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
  // await runReplaceText({ in: inFile, using: usingFile, out: outFile });
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

/*
Remember to add trycatch at end:

try {
  normal flow...
  } catch (err) {
    if (err instanceof Error && err.name === 'ExitPromptError') {
      console.error('\n✖ Prompt cancelled by user. Exiting.');
      process.exit(1);
    } else {
      console.error('\n✖ Unexpected error:', err);
      process.exit(1);
  }
}
*/
