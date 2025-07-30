/* eslint-disable no-console */
import { confirm, input, search, select } from '@inquirer/prompts';
import { makeProgram } from './program.ts';
import {
  inFileConfig,
  outFileConfig,
  mapFileConfig,
  overwriteConfig,
  dryRunConfig,
  confirmOverwriteConfig,
} from './prompts.ts';
import {
  getSymbol,
  S_BAR,
  S_BAR_END,
  S_BAR_H,
  S_CONNECT_LEFT,
  S_STEP_ERROR,
} from './theme/symbols.ts';
import { colors } from './theme/colors.ts';
import { getOutputText } from './utils/replace.ts';
import path from 'path';
import fs from 'node:fs';

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
      let confirmOverwrite = false;
      if (overwrite) confirmOverwrite = await confirm(confirmOverwriteConfig);

      if (!overwrite || !confirmOverwrite) {
        outFile = await input(outFileConfig);
      }
    }

    // Ask if dry run only if other things are being asked
    const ask = Object.entries(options).length < 3;
    const dryRun = options.dryRun ?? (ask ? await select(dryRunConfig) : false);

    const displayArgs = [
      ...(dryRun ? ['--dry-run'] : []),
      `--in=${inFile}`,
      `--map=${mapFile}`,
      ...(outFile ? [`--out=${outFile}`] : []),
    ];

    console.log(colors.dim(`\n${dryRun ? 'Simulating:' : 'Running:'}`));
    console.log(`replace-text ${displayArgs.join(' ')}\n`);

    const outputText = getOutputText({ inFile, mapFile });
    const targetFile = outFile || inFile;
    console.log(
      `${getSymbol('done')}  Replacing text from ${colors.cyan(inFile)}\n${S_BAR}`,
    );
    console.log(
      `${S_CONNECT_LEFT}${S_BAR_H} Writing to ${colors.yellow(targetFile)}\n${S_BAR}`,
    );

    if (dryRun) {
      console.log(
        `${S_CONNECT_LEFT}${S_BAR_H} ${colors.dim(colors.underline('Sample output:'))}\n${S_BAR}${outputText
          .split('\n')
          .slice(0, 10)
          .join(
            `\n${S_BAR}`,
          )}\n${S_BAR_END}${S_BAR_H}${S_BAR_H}${getSymbol('success')}`,
      );
    } else {
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, outputText, 'utf8');
      console.log(
        `${S_BAR_END}${getSymbol('success')} Finished writing changes to ${colors.green(targetFile)}\n`,
      );
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
