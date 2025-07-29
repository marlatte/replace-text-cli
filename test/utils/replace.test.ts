/* eslint-disable no-useless-escape */
import { describe, it, expect, vi } from 'vitest';
import {
  applyReplacements,
  parseMapPattern,
  isRegexPattern,
  readMapFile,
  getOutputText,
} from '../../src/utils/replace.ts';
import { vol } from 'memfs';
import { readFileSync } from 'node:fs';

vi.mock('node:fs');

vol.fromNestedJSON(
  {
    mapFiles: {
      'string.txt': 'red => var(--red)',
      'regex.txt': '/blue/gi => var(--blue)',
      'multi-line.txt': `
        red => var(--red)
        /blue/gi => var(--blue)
        green => var(--green)
      `,
      'comments.txt': `
        red => var(--red)
        # this is a comment
        /blue/gi => var(--blue)
  
        green => var(--green)
      `,
      'warn.txt': '/bad-regex(/i => var(--broken)',
      'throw.txt': 'invalid-line-without-arrow',
      'arrow.txt': `
        ; => \\s=>
      `,
      // Parser removes first escape, so '\w' needs to be '\\w', etc.
      'complex.txt': `
          /(--[\\w-]+): (oklch\\([\\d\\.%\\s]+\\));/g => $2\\s=> var($1)
        `,
    },
    inputFiles: {
      'simple.css':
        'color: Blue;\nbackground-color: green;\nborder: 1px solid red;',
      'complex.css':
        '--color-red-50: oklch(97.1% 0.013 17.38);\n--color-red-100: oklch(93.6% 0.032 17.717);\n--color-yellow-800: oklch(47.6% 0.114 61.907);',
    },
  },
  '/',
);

describe('isRegexPattern', () => {
  it('identifies regex strings correctly', () => {
    expect(isRegexPattern('/abc/i')).toBe(true);
    expect(isRegexPattern('/abc/')).toBe(true);
    expect(isRegexPattern('not-a-regex')).toBe(false);
    expect(isRegexPattern('/missingend')).toBe(false);
    expect(isRegexPattern('/path/to/file')).toBe(false);
  });
});

describe('parseMapPattern', () => {
  it('parses valid regex patterns correctly', () => {
    const result = parseMapPattern('/blue/gi');
    expect(result).toBeInstanceOf(RegExp);
    if (result instanceof RegExp) {
      expect(result.source).toBe('blue');
      expect(result.flags).toBe('gi');
    }
  });

  it('warns and falls back on invalid regex syntax inside valid regex delimiters', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = parseMapPattern('/bad-regex(/i');
    expect(result).toBe('/bad-regex(/i');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Regex rejected'),
    );

    warnSpy.mockRestore();
  });

  it('treats strings starting with / but missing closing slash as literal strings', () => {
    const input = '/path/to/file';
    const result = parseMapPattern(input);
    expect(result).toBe(input);
  });

  it('treats strings starting with / but malformed as literal strings', () => {
    const input = '/bad-regex(/i';
    const result = parseMapPattern(input);
    expect(result).toBe(input);
  });

  it('treats normal strings as literals', () => {
    const input = 'oklch(0.205 0 0)';
    const result = parseMapPattern(input);
    expect(result).toBe(input);
  });
});

describe('readMapFile', () => {
  it('parses a simple string mapping', () => {
    const result = readMapFile('/mapFiles/string.txt');
    expect(result).toEqual([{ from: 'red', to: 'var(--red)' }]);
  });

  it('parses a regex mapping', () => {
    const result = readMapFile('/mapFiles/regex.txt');
    expect(result).toEqual([{ from: /blue/gi, to: 'var(--blue)' }]);
  });

  it('parses multiple valid mappings', () => {
    const result = readMapFile('/mapFiles/multi-line.txt');
    expect(result).toEqual([
      { from: 'red', to: 'var(--red)' },
      { from: /blue/gi, to: 'var(--blue)' },
      { from: 'green', to: 'var(--green)' },
    ]);
  });

  it('ignores empty lines and comments', () => {
    const result = readMapFile('/mapFiles/comments.txt');
    expect(result).toEqual([
      { from: 'red', to: 'var(--red)' },
      { from: /blue/gi, to: 'var(--blue)' },
      { from: 'green', to: 'var(--green)' },
    ]);
  });

  it('warns and falls back on malformed regex', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = readMapFile('/mapFiles/warn.txt');

    expect(result).toEqual([{ from: '/bad-regex(/i', to: 'var(--broken)' }]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Regex rejected'),
    );

    warnSpy.mockRestore();
  });

  it('throws on invalid mapping lines', () => {
    expect(() => readMapFile('/mapFiles/throw.txt')).toThrow(
      'Invalid mapping at line 1: invalid-line-without-arrow',
    );
  });

  it('parses rules that contain an escaped arrow "\\=>"', () => {
    const result = readMapFile('/mapFiles/arrow.txt');
    expect(result).toEqual([{ from: ';', to: ' =>' }]);
  });

  it('parses rules with capture groups', () => {
    const result = readMapFile('/mapFiles/complex.txt');
    expect(result).toEqual([
      { from: /(--[\w-]+): (oklch\([\d\.%\s]+\));/g, to: '$2 => var($1)' },
    ]);
  });
});

describe('applyReplacements', () => {
  it('replaces string literals', () => {
    const input = 'color: blue;';
    const result = applyReplacements(input, [
      { from: 'blue', to: 'var(--blue)' },
    ]);
    expect(result).toBe('color: var(--blue);');
  });

  it('applies regex replacements', () => {
    const input = '--theme-primary: red;';
    const result = applyReplacements(input, [
      { from: /--theme-(\w+)/g, to: '--color-$1' },
    ]);
    expect(result).toBe('--color-primary: red;');
  });

  it('applies multiple rules in order', () => {
    const input = '--theme-primary: blue;';
    const result = applyReplacements(input, [
      { from: /--theme-(\w+)/g, to: '--color-$1' },
      { from: 'blue', to: 'var(--blue)' },
    ]);
    expect(result).toBe('--color-primary: var(--blue);');
  });

  it('leaves input unchanged if no matches', () => {
    const input = '--nothing-here: green;';
    const result = applyReplacements(input, [
      { from: /not-found/, to: 'something' },
    ]);
    expect(result).toBe(input);
  });

  it('handles regex with special replacement chars', () => {
    const input = 'color: blue;';
    const result = applyReplacements(input, [
      { from: /blue/, to: 'var(--$&)' }, // $& inserts matched string
    ]);
    expect(result).toBe('color: var(--blue);');
  });

  it('handles bad regex as a normal string', () => {
    const input = 'bad-regex';
    const result = applyReplacements(input, [
      { from: '/--bad-regex(', to: 'oops' }, // invalid regex
    ]);
    expect(result).toBe(input);
  });

  it('applies regex replacement with capture groups', () => {
    const input = readFileSync('/inputFiles/complex.css', 'utf8');
    const result = applyReplacements(input, [
      { from: /(--[\w-]+): (oklch\([\d\.%\s]+\));/g, to: '$2 => var($1)' },
    ]);

    expect(result).toMatchInlineSnapshot(`
        "oklch(97.1% 0.013 17.38) => var(--color-red-50)
        oklch(93.6% 0.032 17.717) => var(--color-red-100)
        oklch(47.6% 0.114 61.907) => var(--color-yellow-800)"
      `);
  });
});

describe('getOutputText', () => {
  it('reads simple rules and applies them', () => {
    const inFile = '/inputFiles/simple.css';
    const mapFile = '/mapFiles/multi-line.txt';
    const output = getOutputText({ inFile, mapFile });
    expect(output).toMatchInlineSnapshot(`
      "color: var(--blue);
      background-color: var(--green);
      border: 1px solid var(--red);"
    `);
  });

  it('reads and applies rules with capture groups', () => {
    const inFile = '/inputFiles/complex.css';
    const mapFile = '/mapFiles/complex.txt';
    const output = getOutputText({ inFile, mapFile });

    expect(output).toMatchInlineSnapshot(`
      "oklch(97.1% 0.013 17.38) => var(--color-red-50)
      oklch(93.6% 0.032 17.717) => var(--color-red-100)
      oklch(47.6% 0.114 61.907) => var(--color-yellow-800)"
    `);
  });
});
