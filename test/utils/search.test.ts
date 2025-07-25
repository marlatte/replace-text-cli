import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { vol } from 'memfs';
import os from 'node:os';
import {
  getFullPath,
  fileExists,
  getSearchResults,
  getSearchRoot,
  isDirectory,
  listDirectoryEntries,
  validateSearch,
} from '../../src/utils/search';
import path from 'node:path';

// tell vitest to use fs mock from __mocks__ folder
// this can be done in a setup file if fs should always be mocked
vi.mock('node:fs');
vi.mock('node:fs/promises');

beforeEach(() => {
  // reset the state of in-memory fs
  vol.reset();
  vi.spyOn(process, 'cwd').mockReturnValue('/home/user/project');
});

describe('getFullPath', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('expands ~ to home directory', () => {
    vi.spyOn(os, 'homedir').mockReturnValue('/home/user/');
    expect(getFullPath('~/test.txt')).toBe('/home/user/test.txt');
  });

  it('converts relative paths to absolute', () => {
    expect(getFullPath('./test.txt')).toBe('/home/user/project/test.txt');
  });

  it('leaves normal paths unchanged', () => {
    expect(getFullPath('/usr/local')).toBe('/usr/local');
  });
});

describe('fileExists', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('finds existing files', async () => {
    vol.fromJSON(
      {
        './file.css': 'file contents',
      },
      '/fake',
    );
    expect(await fileExists('/fake/file.css')).toBeTruthy();
  });

  it('rejects missing files', async () => {
    expect(await fileExists('/fake/missing.css')).toBeFalsy();
  });
});

describe('isDirectory', () => {
  it('correctly identifies folders', async () => {
    vol.fromJSON(
      {
        './folder/file.js': 'hello world',
      },
      '/root',
    );

    expect(await isDirectory('/root/folder')).toBeTruthy();
    expect(await isDirectory('/root/folder/file.js')).toBeFalsy();
  });
});

describe('getSearchRoot', () => {
  const ROOT = '/';

  beforeEach(() => {
    vol.fromJSON(
      {
        'home/user/project/current.txt': 'current file',
        'home/user/project/subdir/nested.txt': 'nested file',
        'home/user/shared/shared.txt': 'shared file',
        'home/user/.hidden/secret.txt': 'secret file',
        'tmp/temp.txt': 'temporary file',
      },
      ROOT,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('handles absolute paths correctly', async () => {
    const result = await getSearchRoot('/tmp/temp.txt', ROOT);
    expect(result).toBe('/tmp');
  });

  it('returns the same path if it is a valid directory', async () => {
    const result = await getSearchRoot('/home/user', ROOT);
    expect(result).toBe(path.join(ROOT, '/home/user'));
  });

  it('walks up to parent if given path is not a directory', async () => {
    const result = await getSearchRoot('/home/user/project/current.txt', ROOT);
    expect(result).toBe(path.join(ROOT, '/home/user/project'));
  });

  it('returns cwd if nothing in the path exists', async () => {
    const result = await getSearchRoot('/fake/deep/path/here', ROOT);
    expect(result).toBe(ROOT);
  });

  it('walks up to root if it must', async () => {
    const result = await getSearchRoot('/nothing/here', '/nothing');
    expect(result).toBe(ROOT); // fallback to system root
  });

  it('handles files in "."', async () => {
    const result = await getSearchRoot('./current.txt', process.cwd());
    expect(result).toBe('/home/user/project');
  });

  it('handles folders in "."', async () => {
    const result = await getSearchRoot('./subdir/nested.txt', process.cwd());
    expect(result).toBe('/home/user/project/subdir');
  });

  it('handles parent dir ".."', async () => {
    const result = await getSearchRoot('../shared/shared.txt', process.cwd());
    expect(result).toBe('/home/user/shared');
  });
});

describe('listDirectoryEntries', () => {
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

  it('only shows file name, not full path', async () => {
    const entries = await listDirectoryEntries('note');
    expect(entries.map((e) => e.name)).toEqual(['notes.txt']);
    expect(entries.map((e) => e.value)).toEqual([
      '/home/user/project/notes.txt',
    ]);
  });

  it('performs case-insensitive matching', async () => {
    const entries = await listDirectoryEntries('read');
    expect(entries.map((e) => e.name)).toEqual(['README.md']);
  });

  it('lists directories with a trailing slash', async () => {
    const entries = await listDirectoryEntries('doc');
    expect(entries.map((e) => e.name)).toEqual(['docs/']);
  });

  it('sorts alphabetical, directories first', async () => {
    const entries = await listDirectoryEntries('');
    expect(entries.map((e) => e.name)).toEqual([
      'docs/',
      'src/',
      'notes.txt',
      'README.md',
    ]);
  });

  it("returns an empty array if no directory doesn't exist", async () => {
    const entries = await listDirectoryEntries('', '/home/user/invalid');
    expect(entries).toEqual([]);
  });

  it('searches below cwd', async () => {
    const entries = await listDirectoryEntries('', '/home/user/project/docs');
    expect(entries.map((e) => e.name)).toEqual(['manual.pdf', 'readme.md']);
  });
});

describe('getSearchResults', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'index.ts': '',
        'notes.txt': '',
        'README.md': '',
        'docs/readme.md': '',
        'docs/index.md': '',
        'src/index.ts': '',
        'src/utils/helpers.ts': '',
      },
      '/home/user/project',
    );
  });

  it('returns matches for flat files in cwd', async () => {
    const entries = await getSearchResults('read');
    const names = entries.map((e) => e.name);

    expect(names).toContain('README.md');
    expect(names).not.toContain('docs/readme.md'); // flat only
  });

  it('returns matches from nested directory term', async () => {
    const entries = await getSearchResults('docs');
    const names = entries.map((e) => e.name);

    expect(names).toContain('index.md');
    expect(names).toContain('readme.md');
    expect(names).not.toContain('README.md');
  });

  it('returns matches from relative parent traversal', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/home/user/project/docs');
    const entries = await getSearchResults('../../');
    const names = entries.map((e) => e.name);
    expect(names).toEqual(['project/']);
  });
});

describe('validateSearch', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns true for a valid file in a subfolder', async () => {
    vol.fromJSON({ 'folder/file.css': 'Hello world' }, '/');
    const result = await validateSearch('/folder/file.css');
    expect(result).toBe(true);
  });

  it('returns error if the file does not exist', async () => {
    const result = await validateSearch('/nope/missing.txt', {
      extension: '.txt',
    });
    expect(result).toBe('File does not exist.');
  });

  it('returns error if the path is a folder', async () => {
    vol.fromJSON({ 'folder/file.txt': 'hi' }, '/');
    const result = await validateSearch('/folder', { extension: '.txt' });
    expect(result).toBe('You must select a file, not a folder.');
  });

  it('returns true when file matches given extension', async () => {
    vol.fromJSON({ 'file.txt': 'Hello world' }, '/');
    const result = await validateSearch('/file.txt', { extension: '.txt' });
    expect(result).toBe(true);
  });

  it('returns error if the file has the wrong extension', async () => {
    vol.fromJSON({ 'folder/file.md': 'hi' }, '/');
    const result = await validateSearch('/folder/file.md', {
      extension: '.txt',
    });
    expect(result).toMatch(/invalid file extension/i);
  });

  it('returns a custom error message', async () => {
    const result = await validateSearch('/nope/missing.css', {
      error: 'Input file is required',
    });
    expect(result).toMatch(/input file is required/i);
  });

  it('returns error if path is empty', async () => {
    const result = await validateSearch('', {
      error: 'Mapping file is required',
    });
    expect(result).toMatch(/mapping file is required/i);
  });

  it('returns error if path is just extension', async () => {
    vol.fromJSON({ '.txt': 'Hello world' }, '/');
    const result = await validateSearch('.txt', {
      extension: '.txt',
    });
    expect(result).toMatch(/file does not exist/i);
  });
});
