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
import {
  getSymbol,
  S_BAR,
  S_BAR_END,
  S_BAR_H,
  S_STEP_ERROR,
} from './theme/symbols.ts';
import { colors } from './theme/colors.ts';
import { getOutputText } from './utils/replace.ts';
// import fs from 'node:fs';

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

    const outputText = getOutputText({ inFile, mapFile });
    const targetFile = outFile || inFile;
    console.log(`Writing replacements to ${colors.cyan(targetFile)}...\n`);

    if (dryRun) {
      console.log(
        `${getSymbol('done')}  ${colors.dim('Sample output:')}\n${S_BAR}\n${S_BAR}${outputText
          .split('\n')
          .slice(0, 10)
          .map((str, i) => (i & 1 ? colors.bgGray(str) : str))
          .join(`\n${S_BAR}`)}\n${S_BAR_END}${S_BAR_H}${S_BAR_H}`,
      );
    } else {
      // fs.writeFileSync(targetFile, outputText, 'utf8');
    }
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
