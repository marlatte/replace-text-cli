import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  applyReplacements,
  parsePattern,
  isRegexPattern,
  isValidExtension,
  readMappingFile,
} from './replace-text.ts';
import fs from 'fs';

vi.mock('fs');
const mockReadFileSync = fs.readFileSync as Mock;

describe('isRegexPattern', () => {
  it('identifies regex strings correctly', () => {
    expect(isRegexPattern('/abc/i')).toBe(true);
    expect(isRegexPattern('/abc/')).toBe(true);
    expect(isRegexPattern('not-a-regex')).toBe(false);
    expect(isRegexPattern('/missingend')).toBe(false);
    expect(isRegexPattern('/path/to/file')).toBe(false);
  });
});

describe('parsePattern', () => {
  it('parses valid regex patterns correctly', () => {
    const result = parsePattern('/blue/gi');
    expect(result).toBeInstanceOf(RegExp);
    if (result instanceof RegExp) {
      expect(result.source).toBe('blue');
      expect(result.flags).toBe('gi');
    }
  });

  it('warns and falls back on invalid regex syntax inside valid regex delimiters', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = parsePattern('/bad-regex(/i');
    expect(result).toBe('/bad-regex(/i');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Regex rejected'),
    );

    warnSpy.mockRestore();
  });

  it('treats strings starting with / but missing closing slash as literal strings', () => {
    const input = '/path/to/file';
    const result = parsePattern(input);
    expect(result).toBe(input);
  });

  it('treats strings starting with / but malformed as literal strings', () => {
    const input = '/bad-regex(/i';
    const result = parsePattern(input);
    expect(result).toBe(input);
  });

  it('treats normal strings as literals', () => {
    const input = 'oklch(0.205 0 0)';
    const result = parsePattern(input);
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

describe('isValidExtension', () => {
  it('returns true for .txt files', () => {
    expect(isValidExtension('file.txt')).toBe(true);
    expect(isValidExtension('/some/path/to/file.txt')).toBe(true);
  });

  it('returns false for other file types', () => {
    expect(isValidExtension('file.md')).toBe(false);
    expect(isValidExtension('file.env')).toBe(false);
    expect(isValidExtension('file.conf')).toBe(false);
    expect(isValidExtension('file')).toBe(false);
    expect(isValidExtension('file.')).toBe(false);
    expect(isValidExtension('.txt')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isValidExtension('file.TXT')).toBe(true);
    expect(isValidExtension('file.TxT')).toBe(true);
  });
});

describe('readMappingFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses a simple string mapping', () => {
    mockReadFileSync.mockReturnValue('red => var(--red)');

    const result = readMappingFile('fake/path');

    expect(result).toEqual([{ from: 'red', to: 'var(--red)' }]);
  });

  it('parses a regex mapping', () => {
    mockReadFileSync.mockReturnValue('/blue/gi => var(--blue)');

    const result = readMappingFile('fake/path');

    expect(result).toEqual([{ from: /blue/gi, to: 'var(--blue)' }]);
  });

  it('parses multiple valid mappings', () => {
    mockReadFileSync.mockReturnValue(
      `
      red => var(--red)
      /blue/gi => var(--blue)
      green => var(--green)
    `.trim(),
    );

    const result = readMappingFile('fake/path');

    expect(result).toEqual([
      { from: 'red', to: 'var(--red)' },
      { from: /blue/gi, to: 'var(--blue)' },
      { from: 'green', to: 'var(--green)' },
    ]);
  });

  it('ignores empty lines and comments', () => {
    mockReadFileSync.mockReturnValue(`
      red => var(--red)
      # this is a comment
      /blue/gi => var(--blue)

      green => var(--green)
    `);

    const result = readMappingFile('fake/path');

    expect(result).toEqual([
      { from: 'red', to: 'var(--red)' },
      { from: /blue/gi, to: 'var(--blue)' },
      { from: 'green', to: 'var(--green)' },
    ]);
  });

  it('warns and falls back on malformed regex', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockReadFileSync.mockReturnValue('/bad-regex(/i => var(--broken)');

    const result = readMappingFile('fake/path');

    expect(result).toEqual([{ from: '/bad-regex(/i', to: 'var(--broken)' }]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Regex rejected'),
    );

    warnSpy.mockRestore();
  });

  it('throws on invalid mapping lines', () => {
    mockReadFileSync.mockReturnValue('invalid-line-without-arrow');

    expect(() => readMappingFile('fake/path')).toThrow(
      'Invalid mapping at line 1: invalid-line-without-arrow',
    );
  });
});
