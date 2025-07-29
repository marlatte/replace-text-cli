import { confirm, input, search, select } from '@inquirer/prompts';
import { defaultTheme } from './theme/index.ts';
import { getSearchResults, validateSearch } from './utils/search.ts';
import { colors } from './theme/colors.ts';

export type InputConfig = Parameters<typeof input>[0];
export type SearchConfig = Parameters<typeof search>[0];
export type SelectConfig = Parameters<typeof select>[0];
export type ConfirmConfig = Parameters<typeof confirm>[0];

export const inFileConfig = {
  message: 'What file do you want to modify?',
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
    { name: 'Save to a new file.', value: false },
    { name: 'Overwrite the original.', value: true },
  ],
  theme: defaultTheme,
} satisfies SelectConfig;

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
    { name: 'No', description: 'Run program as normal.', value: false },
    { name: 'Yes', description: 'Simulate the output.', value: true },
  ],
  theme: defaultTheme,
} satisfies SelectConfig;
