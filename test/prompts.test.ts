import { input } from '@inquirer/prompts';
import { render } from '@inquirer/testing';
import {
  inFileQuestion,
  outFileQuestion,
  usingFileQuestion,
} from '../src/prompts';
import { describe, it, expect } from 'vitest';
import { getSymbol } from '../src/theme/symbols';
import { Status } from '../src/theme';

const formatText = (status: Status, ...textSegments: string[]) => {
  return `${getSymbol(status, false)}  ${textSegments.join(' ')}`;
};

describe('input prompt', () => {
  it('handles a valid input filename', async () => {
    const { answer, events, getScreen } = await render(input, inFileQuestion);
    expect(getScreen()).toBe(formatText('idle', inFileQuestion.message));

    const userInput = 'input.css';
    events.type(userInput);
    events.keypress('enter');

    await expect(answer).resolves.toEqual(userInput);
    expect(getScreen()).toBe(
      formatText('done', inFileQuestion.message, userInput),
    );
  });

  it('rejects whitespace-only input', async () => {
    const { events, getScreen } = await render(input, inFileQuestion);

    events.type('   ');
    events.keypress('enter');

    await Promise.resolve();
    expect(getScreen()).toMatch(/Input file is required/);
  });

  it('throws on Ctrl+C', async () => {
    const { answer, events } = await render(input, inFileQuestion);

    events.keypress({ name: 'c', ctrl: true });

    await expect(answer).rejects.toThrow();
  });
});

describe('map file', () => {
  it.skip('handles a valid map filename', async () => {
    const { answer, events, getScreen } = await render(
      input,
      usingFileQuestion,
    );

    expect(getScreen()).toBe(formatText('idle', usingFileQuestion.message));

    const userInput = 'map.txt';
    events.type(userInput);
    events.keypress('enter');

    await expect(answer).resolves.toEqual(userInput);
    expect(getScreen()).toBe(
      formatText('done', usingFileQuestion.message, userInput),
    );
  });

  it('rejects empty input', async () => {
    const { events, getScreen } = await render(input, usingFileQuestion);

    events.keypress('enter');

    await Promise.resolve();
    expect(getScreen()).toMatch(/Mapping file is required/);
  });

  it('rejects an invalid map filename', async () => {
    const { events, getScreen } = await render(input, usingFileQuestion);

    events.type('map.css');
    events.keypress('enter');

    await Promise.resolve();
    expect(getScreen()).toMatch(/Invalid file extension/);
  });
});

describe('optional output file prompt', () => {
  it('returns empty string on Enter with no input', async () => {
    const { answer, events, getScreen } = await render(input, outFileQuestion);
    expect(getScreen()).toBe(formatText('idle', outFileQuestion.message));

    events.keypress('enter');
    await expect(answer).resolves.toBe('');
    expect(getScreen()).toBe(formatText('done', outFileQuestion.message));
  });

  it('handles file path with spaces or quotes', async () => {
    const { answer, events, getScreen } = await render(input, outFileQuestion);

    const userInput = '"path with spaces.css"';
    events.type(userInput);
    events.keypress('enter');

    await expect(answer).resolves.toBe(userInput);

    // Flows onto next line, but otherwise matches
    expect(getScreen().replace('\n', '')).toBe(
      formatText('done', outFileQuestion.message, userInput),
    );
  });
});
