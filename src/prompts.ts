import { confirm, input, search, select } from '@inquirer/prompts';
import { defaultTheme } from './theme/index.ts';
import { getSearchResults, validateSearch } from './utils/search.ts';
import { colors } from './theme/colors.ts';

export type InputConfig = Parameters<typeof input>[0];
export type SearchConfig = Parameters<typeof search>[0];
export type SelectConfig = Parameters<typeof select>[0];
export type ConfirmConfig = Parameters<typeof confirm>[0];

export const inFileConfig = {
  message: 'Where is the text to be replaced?',
  theme: defaultTheme,
  source: getSearchResults,
  validate: (val) =>
    validateSearch(val as string, { error: 'Input file is required.' }),
} satisfies SearchConfig;

export const mapFileConfig = {
  message: 'What mapping file should be used?',
  theme: defaultTheme,
  source: getSearchResults,
  validate: (val) =>
    validateSearch(val as string, {
      error: 'Mapping file is required.',
      extension: '.txt',
    }),
} satisfies SearchConfig;

export const overwriteConfig = {
  message: 'Where do you want to save the output?',
  choices: [
    {
      name: 'Save to a new file.',
      value: false,
      description: colors.italic('The safer option'),
    },
    {
      name: 'Overwrite the original.',
      value: true,
      description: colors.reset(
        colors.italic(colors.red('Warning: data may be lost')),
      ),
    },
  ],
  theme: defaultTheme,
} satisfies SelectConfig;

export const confirmOverwriteConfig = {
  message: 'Are you sure you want to overwrite the file?',
  theme: defaultTheme,
  default: false,
  transformer: (answer) =>
    answer ? 'Yes, overwrite it.' : 'No, make a new file.',
} satisfies ConfirmConfig;

export const outFileConfig = {
  message: 'What will the new file be called?',
  theme: defaultTheme,
  validate: (val) => {
    return (
      !!val.match(/.*\..+/) ||
      `Output file must have a name and extension. 
    ${colors.dim(`Eg. ${colors.underline('path/to/file.ext')}`)}
    `
    );
  },
} satisfies InputConfig;

export const dryRunConfig = {
  message: 'Dry run?',
  choices: [
    {
      name: 'No',
      description: colors.italic('Run program as normal'),
      value: false,
    },
    {
      name: 'Yes',
      description: colors.italic('Simulate the output'),
      value: true,
    },
  ],
  theme: defaultTheme,
} satisfies SelectConfig;
