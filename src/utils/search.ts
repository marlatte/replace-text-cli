import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { constants } from 'node:fs/promises';

export function getFullPath(inputPath: string): string {
  return inputPath.startsWith('~')
    ? path.join(os.homedir(), inputPath.slice(1))
    : path.resolve(process.cwd(), inputPath);
}

export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(filepath: string): Promise<boolean> {
  if (await fileExists(filepath)) {
    try {
      const stats = await fs.stat(filepath);
      return stats.isDirectory();
    } catch {
      /* empty */
    }
  }
  return false;
}

export async function getSearchRoot(
  term: string,
  cwd: string,
): Promise<string> {
  let dir = path.isAbsolute(term) ? term : path.join(cwd, term);

  while (!(await isDirectory(dir)) && dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
  }

  return dir;
}

export async function listDirectoryEntries(
  searchTerm: string,
  currentDir: string = process.cwd(),
): Promise<{ name: string; value: string }[]> {
  try {
    const dirContents = await fs.readdir(currentDir, {
      withFileTypes: true,
    });

    return dirContents
      .sort((a, b) => {
        if (a.isDirectory() === b.isDirectory()) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory() ? -1 : 1; // Sort directories first
      })
      .map((entry) => {
        const fullPath = path.join(currentDir, entry.name);
        const displayName = `${entry.name}${entry.isDirectory() ? path.sep : ''}`;
        return {
          name: displayName,
          value: fullPath,
        };
      })
      .filter(({ value }) =>
        value.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  } catch {
    // fall back to empty list if directory read fails
    return [];
  }
}

export async function getSearchResults(term = '', root = process.cwd()) {
  const searchTerm = getFullPath(term.trim());
  const searchRoot = await getSearchRoot(searchTerm, root);
  const results = await listDirectoryEntries(searchTerm, searchRoot);
  return results;
}

export async function validateSearch(
  filePath: string,
  options?: { extension?: string; error?: string },
) {
  const expanded = getFullPath(filePath.trim());
  if (!(await fileExists(expanded))) {
    return options?.error || 'File does not exist.';
  }
  if (await isDirectory(expanded)) {
    return 'You must select a file, not a folder.';
  }
  if (options?.extension) {
    return (
      path.extname(filePath).toLowerCase() === options.extension ||
      `Invalid file extension. Please use "${options.extension}"`
    );
  }
  return true;
}
