import fs from 'fs';

export type MappingRule = {
  from: RegExp | string;
  to: string;
};

export function isRegexPattern(str: string): boolean {
  return /^\/.*\/[gimsuy]*$/.test(str);
}

export function parsePattern(from: string): RegExp | string {
  if (isRegexPattern(from)) {
    const match = from.match(/^\/(.*)\/([gimsuy]*)$/);
    if (!match) throw new Error(`Invalid regex pattern: ${from}`);
    const [, pattern, flags] = match;
    return new RegExp(pattern, flags);
  }
  return from;
}

export function readMappingFile(filePath: string): MappingRule[] {
  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContents.split(/\r?\n/).filter(Boolean);

  return lines.map((line, i) => {
    const [rawFrom, ...rest] = line.split('=>');
    if (!rawFrom || rest.length === 0)
      throw new Error(`Invalid mapping at line ${i + 1}: ${line}`);

    const from = parsePattern(rawFrom.trim());
    const to = rest.join('=>').trim();
    return { from, to };
  });
}

export function applyReplacements(
  content: string,
  rules: MappingRule[]
): string {
  return rules.reduce((acc, { from, to }) => {
    if (from instanceof RegExp) {
      return acc.replace(from, to);
    } else {
      return acc.split(from).join(to);
    }
  }, content);
}
