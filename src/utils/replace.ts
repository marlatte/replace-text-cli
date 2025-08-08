import fs from 'fs';

export type MappingRule = {
  from: RegExp | string;
  to: string;
};

export function isRegexPattern(str: string): boolean {
  return /^\/.+\/[gimsuy]*$/.test(str);
}

export function parseMapPattern(from: string): RegExp | string {
  if (isRegexPattern(from)) {
    const match = from.match(/^\/(.*)\/([gimsuy]*)$/)!;
    const [, pattern, flags] = match;

    try {
      return new RegExp(pattern, flags);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `Warning: Regex rejected, treating as string literal.\n  Pattern: ${from}\n  Reason: ${(err as Error).message}`,
      );
    }
  }

  return from; // treat all others as literals, even if starting with '/'
}

export function readMapFile(filePath: string): MappingRule[] {
  const fileContents = fs.readFileSync(filePath, 'utf-8');

  return (
    fileContents
      .split(/\r?\n/)
      // Strip full-line comments
      .filter((line) => line.trim() && !/^\s*#/.test(line))
      .map((line, i) => {
        // Strip inline comments
        const [mappingPart] = line.split(' # ');
        const [rawFrom, ...rest] = mappingPart.split(' =>');

        if (!rawFrom || rest.length === 0) {
          throw new Error(`Invalid mapping at line ${i + 1}: ${line}`);
        }

        const from = parseMapPattern(rawFrom.trim());
        const rawTo = rest.join(' =>').trim();

        const to = rawTo.replace('\\s', ' ');

        return { from, to };
      })
  );
}

export function applyReplacements(
  content: string,
  rules: MappingRule[],
): string {
  return rules.reduce((acc, { from, to }) => {
    if (from instanceof RegExp) {
      return acc.replace(from, to);
    } else {
      return acc.split(from).join(to);
    }
  }, content);
}

export function getOutputText({
  inFile,
  mapFile,
}: {
  inFile: string;
  mapFile: string;
}) {
  const inFileContents = fs.readFileSync(inFile, 'utf8');
  const mapRules = readMapFile(mapFile);
  return applyReplacements(inFileContents, mapRules);
}
