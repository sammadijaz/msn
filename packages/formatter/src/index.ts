/**
 * MSN Formatter — Auto-formats MSN source files.
 *
 * Responsibilities:
 * - Normalize indentation (remove leading whitespace)
 * - Ensure consistent dash depth
 * - Remove trailing whitespace
 * - Normalize spacing after dashes, colons, and asterisks
 */

export interface FormatOptions {
  /** Final newline at end of file (default: true) */
  finalNewline?: boolean;
  /** Remove blank lines between entries (default: false) */
  removeBlankLines?: boolean;
}

/**
 * Format MSN source text.
 */
export function format(source: string, options: FormatOptions = {}): string {
  const { finalNewline = true, removeBlankLines = false } = options;
  const lines = source.split(/\r?\n/);
  const formatted: string[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();

    // Blank lines
    if (trimmed === "") {
      if (!removeBlankLines) {
        formatted.push("");
      }
      continue;
    }

    // Comments — preserve but trim whitespace
    if (trimmed.startsWith("#")) {
      formatted.push(trimmed);
      continue;
    }

    // Parse dashes
    const dashMatch = trimmed.match(/^(-+)\s*(.*)/);
    if (!dashMatch) {
      // Not a valid MSN line — preserve as-is
      formatted.push(trimmed);
      continue;
    }

    const dashes = dashMatch[1];
    let content = dashMatch[2];

    // Normalize array items
    if (content.startsWith("*")) {
      if (content === "*") {
        // Bare array object marker
        formatted.push(`${dashes} *`);
        continue;
      }
      if (content.startsWith("* ")) {
        const value = content.slice(2).trim();
        formatted.push(`${dashes} * ${value}`);
        continue;
      }
      // Missing space after *
      if (content.length > 1 && content[1] !== " ") {
        const value = content.slice(1).trim();
        formatted.push(`${dashes} * ${value}`);
        continue;
      }
    }

    // Normalize key-value pairs
    const colonIndex = content.indexOf(":");
    if (colonIndex !== -1) {
      const key = content.slice(0, colonIndex).trim();
      const afterColon = content.slice(colonIndex + 1);

      if (afterColon.trim() === "" && colonIndex === content.length - 1) {
        // Key with trailing colon but no value — treat as container
        formatted.push(`${dashes} ${key}`);
        continue;
      }

      const value = afterColon.trim();

      // Strip inline comment for formatting, then re-add
      const commentIdx = findInlineComment(value);
      if (commentIdx !== -1) {
        const val = value.slice(0, commentIdx).trim();
        const comment = value.slice(commentIdx).trim();
        formatted.push(`${dashes} ${key}: ${val} ${comment}`);
      } else {
        formatted.push(`${dashes} ${key}: ${value}`);
      }
      continue;
    }

    // Container key
    formatted.push(`${dashes} ${content.trim()}`);
  }

  let result = formatted.join("\n");
  if (finalNewline && !result.endsWith("\n")) {
    result += "\n";
  }

  return result;
}

function findInlineComment(value: string): number {
  let inQuote = false;
  let quoteChar = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (inQuote) {
      if (ch === quoteChar && value[i - 1] !== "\\") {
        inQuote = false;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === "#" && i > 0 && value[i - 1] === " ") {
        return i - 1;
      }
    }
  }
  return -1;
}
