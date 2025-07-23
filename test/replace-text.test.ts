import { describe, it, expect, vi } from 'vitest';
import {
  applyReplacements,
  parseMapPattern,
  isRegexPattern,
  isValidMapExtension,
  readMapFile,
} from '../src/replace-text.ts';
import { vol } from 'memfs';

vi.mock('node:fs');

vol.fromJSON(
  {
    './string.txt': 'red => var(--red)',
    './regex.txt': '/blue/gi => var(--blue)',
    './multi-line.txt': `
      red => var(--red)
      /blue/gi => var(--blue)
      green => var(--green)
    `,
    './comments.txt': `
      red => var(--red)
      # this is a comment
      /blue/gi => var(--blue)

      green => var(--green)
    `,
    './warn.txt': '/bad-regex(/i => var(--broken)',
    './throw.txt': 'invalid-line-without-arrow',
  },
  '/fake',
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
});

describe('isValidMapExtension', () => {
  it('returns true for .txt files', () => {
    expect(isValidMapExtension('file.txt')).toBe(true);
    expect(isValidMapExtension('/some/path/to/file.txt')).toBe(true);
  });

  it('returns false for other file types', () => {
    expect(isValidMapExtension('file.md')).toBe(false);
    expect(isValidMapExtension('file.env')).toBe(false);
    expect(isValidMapExtension('file.conf')).toBe(false);
    expect(isValidMapExtension('file')).toBe(false);
    expect(isValidMapExtension('file.')).toBe(false);
    expect(isValidMapExtension('.txt')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isValidMapExtension('file.TXT')).toBe(true);
    expect(isValidMapExtension('file.TxT')).toBe(true);
  });
});

describe('readMapFile', () => {
  it('parses a simple string mapping', () => {
    const result = readMapFile('/fake/string.txt');
    expect(result).toEqual([{ from: 'red', to: 'var(--red)' }]);
  });

  it('parses a regex mapping', () => {
    const result = readMapFile('/fake/regex.txt');
    expect(result).toEqual([{ from: /blue/gi, to: 'var(--blue)' }]);
  });

  it('parses multiple valid mappings', () => {
    const result = readMapFile('/fake/multi-line.txt');
    expect(result).toEqual([
      { from: 'red', to: 'var(--red)' },
      { from: /blue/gi, to: 'var(--blue)' },
      { from: 'green', to: 'var(--green)' },
    ]);
  });

  it('ignores empty lines and comments', () => {
    const result = readMapFile('/fake/comments.txt');
    expect(result).toEqual([
      { from: 'red', to: 'var(--red)' },
      { from: /blue/gi, to: 'var(--blue)' },
      { from: 'green', to: 'var(--green)' },
    ]);
  });

  it('warns and falls back on malformed regex', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = readMapFile('/fake/warn.txt');

    expect(result).toEqual([{ from: '/bad-regex(/i', to: 'var(--broken)' }]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Regex rejected'),
    );

    warnSpy.mockRestore();
  });

  it('throws on invalid mapping lines', () => {
    expect(() => readMapFile('/fake/throw.txt')).toThrow(
      'Invalid mapping at line 1: invalid-line-without-arrow',
    );
  });
});
