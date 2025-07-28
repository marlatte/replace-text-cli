import { input, search } from '@inquirer/prompts';
import { render } from '@inquirer/testing';
import {
  inFileQuestion,
  outFileQuestion,
  usingFileQuestion,
} from '../src/prompts';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSymbol, S_POINTER } from '../src/theme/symbols';
import { Status } from '../src/theme';
import { vol } from 'memfs';

vi.mock('node:fs');

beforeEach(() => {
  // reset the state of in-memory fs
  vol.reset();
  vi.spyOn(process, 'cwd').mockReturnValue('/home/user/project');
});

const formatText = (status: Status, ...textSegments: string[]) => {
  return `${getSymbol(status, false)}  ${textSegments.join(' ')}`;
};

describe('input prompt', () => {
  beforeEach(() => {
    vol.fromNestedJSON(
      {
        project: {
          'README.md': '',
          'notes.txt': '',
          docs: {
            'readme.md': 'Hello',
            'manual.pdf': 'PDF content',
          },
          src: {
            'index.ts': '',
            'utils.ts': '',
          },
        },
      },
      '/home/user/',
    );
  });
  const firstLine = formatText('idle', inFileQuestion.message);

  it('handles a file', async () => {
    const { answer, events, getScreen } = await render(search, inFileQuestion);

    expect(getScreen()).toMatchInlineSnapshot(`
      "${firstLine} 
      ${S_POINTER} docs/
        src/
        notes.txt
        README.md
      (Use arrow keys)"
      `);

    events.type('notes');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "${firstLine} notes
      ${S_POINTER} notes.txt"
      `);

    events.keypress('tab');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "${firstLine} notes.txt
      ${S_POINTER} notes.txt"
      `);

    events.keypress('enter');
    await Promise.resolve();

    await expect(answer).resolves.toEqual('notes.txt');
    expect(getScreen()).toBe(
      formatText('done', inFileQuestion.message, 'notes.txt'),
    );
  });

  it('whitespace-only input treated as blank', async () => {
    const { events, getScreen } = await render(search, inFileQuestion);

    events.type('   ');
    await Promise.resolve();
    events.keypress('enter');

    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "${firstLine} docs/
      ${S_POINTER} docs/manual.pdf
        docs/readme.md
      (Use arrow keys)"
      `);
  });

  it("won't submit on invalid path", async () => {
    const { events, getScreen } = await render(search, inFileQuestion);
    const errorMessage = `
      "${firstLine} not/real
      │
      └▲ No results found"    
    `;

    events.type('not/real');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(errorMessage);

    events.keypress('enter');

    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(errorMessage);
  });

  it('throws on Ctrl+C', async () => {
    const { answer, events } = await render(search, inFileQuestion);

    events.keypress({ name: 'c', ctrl: true });

    await expect(answer).rejects.toThrow();
  });
});

describe.skip('map file', () => {
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

describe.skip('optional output file prompt', () => {
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
