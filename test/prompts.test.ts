import { input, search } from '@inquirer/prompts';
import { render } from '@inquirer/testing';
import { inFileConfig, outFileConfig, mapFileConfig } from '../src/prompts';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSymbol, S_POINTER } from '../src/theme/symbols';
import { Status } from '../src/theme';
import { vol } from 'memfs';

vi.mock('node:fs');

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
        'map.txt': '',
      },
    },
  },
  '/home/user/',
);

const cwdContents = `${S_POINTER} docs/
        src/
        notes.txt
        README.md
      (Use arrow keys)`;

beforeEach(() => {
  vi.spyOn(process, 'cwd').mockReturnValue('/home/user/project');
});

const formatText = (status: Status, ...textSegments: string[]) => {
  return `${getSymbol(status, false)}  ${textSegments.join(' ')}`;
};

describe('input prompt', () => {
  const firstLine = formatText('idle', inFileConfig.message);

  it('handles a file', async () => {
    const { answer, events, getScreen } = await render(search, inFileConfig);

    expect(getScreen()).toMatchInlineSnapshot(`
      "${firstLine} 
      ${cwdContents}"
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
      formatText('done', inFileConfig.message, 'notes.txt'),
    );
  });

  it('whitespace-only input treated as blank', async () => {
    const { events, getScreen } = await render(search, inFileConfig);

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
    const { events, getScreen } = await render(search, inFileConfig);
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
    const { answer, events } = await render(search, inFileConfig);

    events.keypress({ name: 'c', ctrl: true });

    await expect(answer).rejects.toThrow();
  });
});

describe('map file', () => {
  const firstLine = formatText('idle', mapFileConfig.message);

  it('handles a valid map file', async () => {
    const { answer, events, getScreen } = await render(search, mapFileConfig);

    expect(getScreen()).toMatchInlineSnapshot(`
      "${firstLine} 
      ${cwdContents}"
      `);

    events.type('src/m');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
        "${firstLine} src/m
        ${S_POINTER} src/map.txt"
        `);

    events.keypress('tab');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
        "${firstLine} src/map.txt
        ${S_POINTER} src/map.txt"
        `);

    events.keypress('enter');
    await Promise.resolve();

    await expect(answer).resolves.toEqual('src/map.txt');
    expect(getScreen()).toBe(
      formatText('done', mapFileConfig.message, 'src/map.txt'),
    );
  });

  it('rejects an invalid map file', async () => {
    const { events, getScreen } = await render(search, mapFileConfig);

    events.type('read');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "${firstLine} read
      ${S_POINTER} README.md"
      `);

    events.keypress('tab');
    await Promise.resolve();
    events.keypress('enter');
    await Promise.resolve();

    expect(getScreen()).toMatch(/Invalid file extension/);
  });
});

describe.skip('optional output file prompt', () => {
  it('returns empty string on Enter with no input', async () => {
    const { answer, events, getScreen } = await render(input, outFileConfig);
    expect(getScreen()).toBe(formatText('idle', outFileConfig.message));

    events.keypress('enter');
    await expect(answer).resolves.toBe('');
    expect(getScreen()).toBe(formatText('done', outFileConfig.message));
  });

  it('handles file path with spaces or quotes', async () => {
    const { answer, events, getScreen } = await render(input, outFileConfig);

    const userInput = '"path with spaces.css"';
    events.type(userInput);
    events.keypress('enter');

    await expect(answer).resolves.toBe(userInput);

    // Flows onto next line, but otherwise matches
    expect(getScreen().replace('\n', '')).toBe(
      formatText('done', outFileConfig.message, userInput),
    );
  });
});
