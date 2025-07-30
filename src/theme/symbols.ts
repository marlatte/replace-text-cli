/* eslint-disable @typescript-eslint/no-unused-vars */

/* Borrowed from the good folks at @clack/packages/prompts/src/common.ts */

import isUnicodeSupported from 'is-unicode-supported';
import colors from 'yoctocolors';
import type { Status } from './index.ts';

const unicode = isUnicodeSupported();
const unicodeOr = (c: string, fallback: string) => (unicode ? c : fallback);

const S_STEP_ACTIVE = unicodeOr('◆', '*');
const S_STEP_CANCEL = unicodeOr('■', 'x');
export const S_STEP_ERROR = unicodeOr('▲', 'x');
const S_STEP_SUBMIT = unicodeOr('◇', 'o');

const S_BAR_START = unicodeOr('┌', 'T');
export const S_BAR = unicodeOr('│', '|');
export const S_BAR_END = unicodeOr('└', '—');

const S_RADIO_ACTIVE = unicodeOr('●', '>');
const S_RADIO_INACTIVE = unicodeOr('○', ' ');
const S_CHECKBOX_ACTIVE = unicodeOr('◻', '[•]');
const S_CHECKBOX_SELECTED = unicodeOr('◼', '[+]');
const S_CHECKBOX_INACTIVE = unicodeOr('◻', '[ ]');
const S_PASSWORD_MASK = unicodeOr('▪', '•');

export const S_BAR_H = unicodeOr('─', '-');
const S_CORNER_TOP_RIGHT = unicodeOr('╮', '+');
const S_CONNECT_LEFT = unicodeOr('├', '+');
const S_CORNER_BOTTOM_RIGHT = unicodeOr('╯', '+');

const S_INFO = unicodeOr('●', '•');
const S_SUCCESS = unicodeOr('◆', '*');
const S_WARN = unicodeOr('▲', '!');
const S_ERROR = unicodeOr('■', 'x');

export const S_POINTER = unicodeOr('❯', '>');

export const getSymbol = (status: Status, useColor = true) => {
  const color = {
    idle: colors.cyan,
    cancel: colors.red,
    error: colors.yellow,
    done: colors.green,
  }[status];

  const icon = {
    idle: S_STEP_ACTIVE,
    cancel: S_STEP_CANCEL,
    error: S_STEP_ERROR,
    done: S_STEP_SUBMIT,
  }[status];

  return useColor ? color(icon) : icon;
};
