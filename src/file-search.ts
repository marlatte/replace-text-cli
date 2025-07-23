import { search } from '@inquirer/prompts';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function getFullPath(inputPath: string): string {
  return inputPath.startsWith('~')
    ? path.join(os.homedir(), inputPath.slice(1))
    : path.resolve(process.cwd(), inputPath);
}

export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
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

export async function searchFile(message: string): Promise<string> {
  const root = process.cwd();

  const answer = await search({
    message,
    source: async (term = '') => {
      const expandedTerm = getFullPath(term.trim());
      let searchDir = path.isAbsolute(expandedTerm)
        ? expandedTerm
        : path.join(root, expandedTerm);

      // Navigate up to the closest existing directory
      while (
        !(await isDirectory(searchDir)) &&
        searchDir !== path.dirname(searchDir)
      ) {
        searchDir = path.dirname(searchDir);
      }

      let entries: { name: string; value: string }[] = [];
      try {
        const dirContents = await fs.readdir(searchDir, {
          withFileTypes: true,
        });
        entries = dirContents
          .sort((a, b) => {
            if (a.isDirectory() === b.isDirectory()) {
              return a.name.localeCompare(b.name);
            }
            return a.isDirectory() ? -1 : 1; // Sort directories first
          })
          .map((entry) => {
            const fullPath = path.join(searchDir, entry.name);
            const displayName =
              path.relative(root, fullPath) + (entry.isDirectory() ? '/' : '');
            return {
              name: displayName,
              value: fullPath,
            };
          })
          .filter(({ name }) => name.includes(term));
      } catch {
        // fall back to empty list if dir read fails
      }

      return entries;
    },
    validate: async (filePath) => {
      const expanded = getFullPath(filePath);
      if (!(await fileExists(expanded))) return 'File does not exist.';
      if (await isDirectory(expanded))
        return 'You must select a file, not a folder.';
      return true;
    },
  });

  return answer;
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
