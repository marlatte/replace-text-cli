import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { vol } from 'memfs';
import {
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

describe('fileExists', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('finds existing files', () => {
    vol.fromJSON(
      {
        './file.css': 'file contents',
      },
      '/fake',
    );
    expect(fileExists('/fake/file.css')).toBeTruthy();
  });

  it('rejects missing files', () => {
    expect(fileExists('/fake/missing.css')).toBeFalsy();
  });
});

describe('isDirectory', () => {
  it('correctly identifies folders', () => {
    vol.fromJSON(
      {
        './folder/file.js': 'hello world',
      },
      '/root',
    );

    expect(isDirectory('/root/folder')).toBeTruthy();
    expect(isDirectory('/root/folder/file.js')).toBeFalsy();
  });
});

describe('getSearchRoot', () => {
  const ROOT = '/'; // Needs to be this for later cwd mocking

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

  it('handles absolute paths correctly', () => {
    const result = getSearchRoot('/tmp/temp.txt', ROOT);
    expect(result).toBe('/tmp');
  });

  it('returns the same path if it is a valid directory', () => {
    const result = getSearchRoot('/home/user', ROOT);
    expect(result).toBe(path.join(ROOT, '/home/user'));
  });

  it('walks up to parent if given path is not a directory', () => {
    const result = getSearchRoot('/home/user/project/current.txt', ROOT);
    expect(result).toBe(path.join(ROOT, '/home/user/project'));
  });

  it('returns given root when path does not exist', () => {
    const result = getSearchRoot('/nothing/to/see/here', '/nothing');
    expect(result).toBe('/nothing');
  });

  it('handles files in "."', () => {
    const result = getSearchRoot('./current.txt', process.cwd());
    expect(result).toBe('/home/user/project');
  });

  it('handles folders in "."', () => {
    const result = getSearchRoot('./subdir/nested.txt', process.cwd());
    expect(result).toBe('/home/user/project/subdir');
  });

  it('handles parent dir ".."', () => {
    const result = getSearchRoot('../shared/shared.txt', process.cwd());
    expect(result).toBe('/home/user/shared');
  });

  it('returns identity when searchTerm is cwd', () => {
    const cwd = process.cwd();
    const result = getSearchRoot(cwd, cwd);
    expect(result).toBe(cwd);
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

  it('shows path relative to root', () => {
    const root = '/home/user';
    const searchTerm = 'project/note';
    const entries = listDirectoryEntries(
      searchTerm,
      getSearchRoot(searchTerm, root),
      root,
    );
    expect(entries).toEqual(['project/notes.txt']);
  });

  it('performs case-insensitive matching', () => {
    const entries = listDirectoryEntries('read');
    expect(entries).toEqual(['README.md']);
  });

  it('lists directories with a trailing slash', () => {
    const entries = listDirectoryEntries('doc');
    expect(entries).toEqual(['docs/']);
  });

  it('sorts alphabetical, directories first', () => {
    const entries = listDirectoryEntries('');
    expect(entries).toEqual(['docs/', 'src/', 'notes.txt', 'README.md']);
  });

  it("returns an empty array if directory doesn't exist", () => {
    const entries = listDirectoryEntries('', '/home/user/invalid');
    expect(entries).toEqual([]);
  });

  it('searches below cwd', () => {
    const entries = listDirectoryEntries('', '/home/user/project/docs');
    expect(entries).toEqual(['docs/manual.pdf', 'docs/readme.md']);
  });
});

describe('getSearchResults', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'project/index.ts': '',
        'project/notes.txt': '',
        'project/README.md': '',
        'project/docs/readme.md': '',
        'project/docs/index.md': '',
        'project/src/index.ts': '',
        'project/src/utils/helpers.ts': '',
      },
      '/home/user/',
    );
  });

  it('returns all contents on empty string', () => {
    const entries = getSearchResults('');
    expect(entries).toEqual([
      'docs/',
      'src/',
      'index.ts',
      'notes.txt',
      'README.md',
    ]);
  });

  it('returns matches for flat files in cwd', () => {
    const entries = getSearchResults('read');

    expect(entries).toHaveLength(1);
    expect(entries).toContain('README.md');
    expect(entries).not.toContain('docs/readme.md'); // flat only
  });

  it('returns matches from nested directory term', () => {
    const entries = getSearchResults('docs');

    expect(entries).toContain('docs/index.md');
    expect(entries).toContain('docs/readme.md');
    expect(entries).not.toContain('README.md');
  });

  it('returns matches from relative parent traversal', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/home/user/project/docs');
    const entries = getSearchResults('../');

    // Doesn't show cwd for some reason
    expect(entries).toEqual([
      '../src/',
      '../index.ts',
      '../notes.txt',
      '../README.md',
    ]);
  });
});

describe('validateSearch', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns true for a valid file in a subfolder', () => {
    vol.fromJSON({ 'folder/file.css': 'Hello world' }, '/');
    const result = validateSearch('/folder/file.css');
    expect(result).toBe(true);
  });

  it('returns error if the file does not exist', () => {
    const result = validateSearch('/nope/missing.txt', {
      extension: '.txt',
    });
    expect(result).toBe('File does not exist.');
  });

  it('returns error if the path is a folder', () => {
    vol.fromJSON({ 'folder/file.txt': 'hi' }, '/');
    const result = validateSearch('/folder', { extension: '.txt' });
    expect(result).toBe('You must select a file, not a folder.');
  });

  it('returns true when file matches given extension', () => {
    vol.fromJSON({ 'file.txt': 'Hello world' }, '/');
    const result = validateSearch('/file.txt', { extension: '.txt' });
    expect(result).toBe(true);
  });

  it('returns error if the file has the wrong extension', () => {
    vol.fromJSON({ 'folder/file.md': 'hi' }, '/');
    const result = validateSearch('/folder/file.md', {
      extension: '.txt',
    });
    expect(result).toMatch(/invalid file extension/i);
  });

  it('returns a custom error message', () => {
    const result = validateSearch('/nope/missing.css', {
      error: 'Input file is required',
    });
    expect(result).toMatch(/input file is required/i);
  });

  it('returns error if path is empty', () => {
    const result = validateSearch('', {
      error: 'Mapping file is required',
    });
    expect(result).toMatch(/mapping file is required/i);
  });

  it('returns error if path is just extension', () => {
    vol.fromJSON({ '.txt': 'Hello world' }, '/');
    const result = validateSearch('.txt', {
      extension: '.txt',
    });
    expect(result).toMatch(/file does not exist/i);
  });
});
