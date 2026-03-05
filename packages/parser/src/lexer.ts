import { Token, TokenType } from "./types.js";

/**
 * MSN Lexer — Tokenizes MSN source text into a stream of tokens.
 */
export class Lexer {
  private lines: string[];

  constructor(source: string) {
    this.lines = source.split(/\r?\n/);
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    for (let i = 0; i < this.lines.length; i++) {
      const raw = this.lines[i];
      const lineNum = i + 1;

      // Blank lines
      if (raw.trim() === "") {
        tokens.push({ type: TokenType.BLANK, depth: 0, raw, line: lineNum });
        continue;
      }

      // Full-line comments
      if (raw.trimStart().startsWith("#")) {
        tokens.push({ type: TokenType.COMMENT, depth: 0, raw, line: lineNum });
        continue;
      }

      // Count dashes
      const dashMatch = raw.match(/^(-+)\s/);
      if (!dashMatch) {
        throw new LexerError(
          `Invalid syntax: line must start with dashes followed by a space`,
          lineNum,
        );
      }

      const dashes = dashMatch[1];
      const depth = dashes.length;
      const content = raw.slice(dashes.length).trimStart();

      // Strip inline comments
      const contentNoComment = stripInlineComment(content);

      // Array object (bare *)
      if (contentNoComment === "*") {
        tokens.push({
          type: TokenType.ARRAY_OBJECT,
          depth,
          raw,
          line: lineNum,
        });
        continue;
      }

      // Array item (* value)
      if (contentNoComment.startsWith("* ")) {
        const value = contentNoComment.slice(2).trim();
        tokens.push({
          type: TokenType.ARRAY_ITEM,
          depth,
          value,
          raw,
          line: lineNum,
        });
        continue;
      }

      // Key-value or container
      const colonIndex = contentNoComment.indexOf(": ");
      // Also check if the entire content after trim ends at colon (for multiline markers)
      const endsWithColon = contentNoComment.endsWith(":");

      if (colonIndex !== -1) {
        const key = contentNoComment.slice(0, colonIndex).trim();
        const value = contentNoComment.slice(colonIndex + 2).trim();

        // Multiline marker
        if (value === "|" || value === ">") {
          tokens.push({
            type: TokenType.MULTILINE_MARKER,
            depth,
            key,
            multilineMode: value as "|" | ">",
            raw,
            line: lineNum,
          });
          continue;
        }

        tokens.push({
          type: TokenType.KEY_VALUE,
          depth,
          key,
          value,
          raw,
          line: lineNum,
        });
        continue;
      }

      // Container (key with no value)
      const key = contentNoComment.trim();
      if (key) {
        tokens.push({
          type: TokenType.CONTAINER,
          depth,
          key,
          raw,
          line: lineNum,
        });
      }
    }

    return tokens;
  }
}

function stripInlineComment(content: string): string {
  let inQuote = false;
  let quoteChar = "";
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuote) {
      if (ch === quoteChar && content[i - 1] !== "\\") {
        inQuote = false;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === "#" && i > 0 && content[i - 1] === " ") {
        return content.slice(0, i).trimEnd();
      }
    }
  }
  return content;
}

export class LexerError extends Error {
  line: number;

  constructor(message: string, line: number) {
    super(`${message} (line ${line})`);
    this.name = "LexerError";
    this.line = line;
  }
}
