import { describe, it, expect } from 'vitest';
import { makeProgram } from '../src/program';

function testProgram(argv: string[]) {
  return makeProgram({ exitOverride: true, suppressOutput: true }).parse(argv, {
    from: 'user',
  });
}

describe('makeProgram', () => {
  it('parses all options', () => {
    const program = testProgram([
      '--in',
      'input.txt',
      '--using',
      'map.txt',
      '--out',
      'output.txt',
    ]);
    expect(program.opts()).toEqual({
      in: 'input.txt',
      using: 'map.txt',
      out: 'output.txt',
    });
  });

  it('omits --out if not provided', () => {
    const program = testProgram(['--in', 'a.txt', '--using', 'b.txt']);
    expect(program.opts()).toEqual({
      in: 'a.txt',
      using: 'b.txt',
      out: undefined,
    });
  });

  it('throws on unknown args', () => {
    expect(() => {
      testProgram(['--in', 'a', '--using', 'b', '--put']);
    }).toThrow(/unknown option/i);
  });

  it('parses empty args as empty opts', () => {
    const program = testProgram([]);
    expect(program.opts()).toEqual({
      in: undefined,
      using: undefined,
      out: undefined,
    });
  });
});
