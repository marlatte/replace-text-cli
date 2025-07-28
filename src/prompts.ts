import { input, search } from '@inquirer/prompts';

import { defaultTheme } from './theme/index.ts';
import { getSearchResults, validateSearch } from './utils/search.ts';

export type InputConfig = Parameters<typeof input>[0];
export type SearchConfig = Parameters<typeof search>[0];

export const inFileQuestion: SearchConfig = {
  message: 'What file do you want to modify?',
  theme: defaultTheme,
  source: getSearchResults,
  validate: (val) =>
    validateSearch(val as string, { error: 'Input file is required.' }),
};

export const usingFileQuestion: InputConfig = {
  message: 'What mapping file should be used?',
  theme: defaultTheme,
  validate: (val) => {
    const trimmed = val.trim();

    if (trimmed === '') return 'Mapping file is required';

    return (
      trimmed.endsWith('.txt') || 'Invalid file extension. Please use ".txt"'
    );
  },
};

export const outFileQuestion: InputConfig = {
  message: 'Where should the result be written? (Leave blank to overwrite)',
  theme: defaultTheme,
};
