/**
 * Minimal INI parser/stringifier — replaces Python's configparser.
 * Supports [section] + key = value format.
 */

export function parse(content: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let currentSection = '';
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (!result[currentSection]) result[currentSection] = {};
      continue;
    }
    const eqIndex = line.indexOf('=');
    if (eqIndex !== -1 && currentSection) {
      const key = line.substring(0, eqIndex).trim();
      const value = line.substring(eqIndex + 1).trim();
      result[currentSection][key] = value;
    }
  }
  return result;
}

export function stringify(data: Record<string, Record<string, string>>): string {
  const parts: string[] = [];
  for (const [section, entries] of Object.entries(data)) {
    parts.push(`[${section}]`);
    for (const [key, value] of Object.entries(entries)) {
      parts.push(`${key} = ${value}`);
    }
    parts.push('');
  }
  return parts.join('\n');
}
