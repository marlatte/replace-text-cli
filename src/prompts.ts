import { input, search } from '@inquirer/prompts';

import { defaultTheme } from './theme/index.ts';
import { getSearchResults, validateSearch } from './utils/search.ts';

export type InputConfig = Parameters<typeof input>[0];
export type SearchConfig = Parameters<typeof search>[0];

export const inFileConfig: SearchConfig = {
  message: 'What file do you want to modify?',
  theme: defaultTheme,
  source: getSearchResults,
  validate: (val) =>
    validateSearch(val as string, { error: 'Input file is required.' }),
};

export const mapFileConfig: SearchConfig = {
  message: 'What mapping file should be used?',
  theme: defaultTheme,
  source: getSearchResults,
  validate: (val) =>
    validateSearch(val as string, {
      error: 'Mapping file is required.',
      extension: '.txt',
    }),
};

export const outFileConfig: InputConfig = {
  message: 'Where should the result be written? (Leave blank to overwrite)',
  theme: defaultTheme,
};
