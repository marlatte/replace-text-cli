/* eslint-disable no-console */
import { input, search, select } from '@inquirer/prompts';
import { makeProgram } from './program.ts';
import {
  inFileConfig,
  outFileConfig,
  mapFileConfig,
  overwriteConfig,
  dryRunConfig,
} from './prompts.ts';
import { getSymbol, S_STEP_ERROR } from './theme/symbols.ts';
import { colors } from './theme/colors.ts';

const program = makeProgram();

program.parse();

async function main() {
  try {
    const options = program.opts() as {
      in?: string;
      map?: string;
      out?: string | boolean;
      dryRun?: boolean;
    };

    const inFile = options.in ?? ((await search(inFileConfig)) as string);
    const mapFile = options.map ?? ((await search(mapFileConfig)) as string);

    let outFile: string | undefined;
    if (options.out) {
      if (typeof options.out === 'string') {
        outFile = options.out;
      }
    } else {
      const overwrite = await select(overwriteConfig);
      if (!overwrite) {
        outFile = await input(outFileConfig);
      }
    }

    const dryRun = options.dryRun ?? (await select(dryRunConfig));

    const displayArgs = [
      ...(dryRun ? ['--dry-run'] : []),
      `--in=${inFile}`,
      `--map=${mapFile}`,
      ...(outFile ? [`--out=${outFile}`] : []),
    ];

    console.log(`\n${dryRun ? 'Simulating:' : 'Running:'}`);
    console.log(`replace-text ${displayArgs.join(' ')}\n`);

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
