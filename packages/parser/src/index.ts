export { Lexer, LexerError } from "./lexer.js";
export { Parser, ParserError, inferType } from "./parser.js";
export { Compiler } from "./compiler.js";
export {
  TokenType,
  type Token,
  type ASTNode,
  type JsonValue,
  type ParseResult,
  type ParseError,
  type ParseOptions,
  type ValidationError,
} from "./types.js";

import { Compiler } from "./compiler.js";
import type { JsonValue } from "./types.js";

/**
 * Compile MSN source to a JSON value.
 * This is the primary entry point for most use cases.
 */
export function compile(source: string): JsonValue {
  const compiler = new Compiler();
  return compiler.compile(source);
}

/**
 * Compile MSN source to a formatted JSON string.
 */
export function compileToString(source: string, indent: number = 2): string {
  const compiler = new Compiler();
  return compiler.compileToString(source, indent);
}
