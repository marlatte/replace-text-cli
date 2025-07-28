import type { InputConfig, SearchConfig } from '../prompts.ts';
import { colors } from './colors.ts';
import { S_BAR, S_BAR_END, S_STEP_ERROR, getSymbol } from './symbols.ts';

export type Status = 'idle' | 'done' | 'cancel' | 'error';

type InputTheme = InputConfig['theme'];
type SearchTheme = SearchConfig['theme'];

export const defaultTheme = {
  prefix: {
    done: `${getSymbol('done')} `,
    idle: `${getSymbol('idle')} `,
  },
  style: {
    error: (text: string) =>
      colors.yellow(`${S_BAR}\n${S_BAR_END}${S_STEP_ERROR} ${text}`),
  },
} satisfies InputTheme | SearchTheme;
