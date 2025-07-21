import { input } from '@inquirer/prompts';
import { isValidMapExtension } from './replace-text.ts';
import { defaultTheme } from './theme/index.ts';

export type InputConfig = Parameters<typeof input>[0];

export const inFileQuestion: InputConfig = {
  message: 'What file do you want to modify?',
  theme: defaultTheme,
  validate: (val) => val.trim() !== '' || 'Input file is required',
};

export const usingFileQuestion: InputConfig = {
  message: 'What mapping file should be used?',
  theme: defaultTheme,
  validate: (val) => {
    const trimmed = val.trim();

    if (trimmed === '') return 'Mapping file is required';

    return (
      isValidMapExtension(val) || 'Invalid file extension. Please use ".txt"'
    );
  },
};

export const outFileQuestion: InputConfig = {
  message: 'Where should the result be written? (Leave blank to overwrite)',
  theme: defaultTheme,
};
