/**
 * MSN Type Definitions
 */

export enum TokenType {
  COMMENT = "COMMENT",
  KEY_VALUE = "KEY_VALUE",
  CONTAINER = "CONTAINER",
  ARRAY_ITEM = "ARRAY_ITEM",
  ARRAY_OBJECT = "ARRAY_OBJECT",
  MULTILINE_MARKER = "MULTILINE_MARKER",
  MULTILINE_CONTENT = "MULTILINE_CONTENT",
  BLANK = "BLANK",
}

export interface Token {
  type: TokenType;
  depth: number;
  key?: string;
  value?: string;
  raw: string;
  line: number;
  multilineMode?: "|" | ">";
}

export interface ASTNode {
  type: "object" | "array" | "value" | "array-item" | "root";
  key?: string;
  value?: JsonValue;
  children: ASTNode[];
  line?: number;
  depth?: number;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ParseResult {
  ast: ASTNode;
  json: JsonValue;
}

export interface ParseError {
  message: string;
  line: number;
  column?: number;
}

export interface ParseOptions {
  /** Whether to include comments in the AST */
  includeComments?: boolean;
  /** Whether to throw on first error or collect all errors */
  throwOnError?: boolean;
  /** Source filename for error messages */
  filename?: string;
}

export interface ValidationError {
  message: string;
  line: number;
  column?: number;
  severity: "error" | "warning";
}
