import fs from 'node:fs';
import path from 'node:path';

export function fileExists(filepath: string) {
  try {
    fs.accessSync(filepath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function isDirectory(filepath: string) {
  if (fileExists(filepath)) {
    try {
      const stats = fs.statSync(filepath);
      return stats.isDirectory();
    } catch {
      /* empty */
    }
  }
  return false;
}

export function getSearchRoot(term: string, root: string) {
  let pathToCurrentDir = path.join(root, term);

  while (!isDirectory(pathToCurrentDir) && pathToCurrentDir !== root) {
    pathToCurrentDir = path.dirname(pathToCurrentDir);
  }
  return pathToCurrentDir;
}

export function listDirectoryEntries(
  searchTerm: string,
  currentDir: string = process.cwd(),
  root: string = process.cwd(),
) {
  try {
    const dirContents = fs.readdirSync(currentDir, {
      withFileTypes: true,
    });

    return dirContents
      .sort((a, b) => {
        if (a.isDirectory() === b.isDirectory()) {
          return a.name.localeCompare(b.name);
        }

        // Sort dir first
        return a.isDirectory() ? -1 : 1;
      })
      .map((entry) => {
        const pathToEntry = path.relative(
          root,
          path.join(currentDir, entry.name),
        );
        const end = entry.isDirectory() ? path.sep : '';
        return `${pathToEntry}${end}`;
      })
      .filter((entry) =>
        entry.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()),
      );
  } catch {
    // fall back to empty list if directory read fails
    return [];
  }
}

export function getSearchResults(term = '') {
  const root = process.cwd();
  const searchTerm = term.trim();
  const searchRoot = getSearchRoot(searchTerm, root);
  const results = listDirectoryEntries(searchTerm, searchRoot, root);
  return results;
}

export function validateSearch(
  filePath: string,
  options?: { extension?: string; error?: string },
) {
  const trimmed = filePath.trim();
  if (!fileExists(trimmed)) {
    return options?.error || 'File does not exist.';
  }
  if (isDirectory(trimmed)) {
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
