import { Token, TokenType, ASTNode } from "./types.js";
import { Lexer } from "./lexer.js";

/**
 * MSN Parser — Converts tokens into an AST.
 */
export class Parser {
  parse(source: string): ASTNode {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    return this.buildAST(tokens);
  }

  private buildAST(tokens: Token[]): ASTNode {
    const root: ASTNode = { type: "root", children: [] };
    const stack: { node: ASTNode; depth: number }[] = [
      { node: root, depth: 0 },
    ];

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === TokenType.BLANK || token.type === TokenType.COMMENT) {
        i++;
        continue;
      }

      const depth = token.depth;

      // Pop stack to find parent
      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;

      switch (token.type) {
        case TokenType.KEY_VALUE: {
          const node: ASTNode = {
            type: "value",
            key: token.key,
            value: inferType(token.value!),
            children: [],
            line: token.line,
            depth,
          };
          parent.children.push(node);
          i++;
          break;
        }

        case TokenType.CONTAINER: {
          const node: ASTNode = {
            type: "object",
            key: token.key,
            children: [],
            line: token.line,
            depth,
          };
          parent.children.push(node);
          stack.push({ node, depth });
          i++;
          break;
        }

        case TokenType.ARRAY_ITEM: {
          // Ensure parent is an array or convert it
          this.ensureArray(parent);
          const node: ASTNode = {
            type: "array-item",
            value: inferType(token.value!),
            children: [],
            line: token.line,
            depth,
          };
          parent.children.push(node);
          i++;
          break;
        }

        case TokenType.ARRAY_OBJECT: {
          this.ensureArray(parent);
          const node: ASTNode = {
            type: "object",
            children: [],
            line: token.line,
            depth,
          };
          parent.children.push(node);
          stack.push({ node, depth });
          i++;
          break;
        }

        case TokenType.MULTILINE_MARKER: {
          const mode = token.multilineMode!;
          const multilineDepth = depth + 1;
          const lines: string[] = [];

          i++;
          // Collect continuation lines
          while (i < tokens.length) {
            const nextToken = tokens[i];
            if (
              nextToken.type === TokenType.BLANK ||
              nextToken.type === TokenType.COMMENT
            ) {
              i++;
              continue;
            }
            if (nextToken.depth !== multilineDepth) {
              break;
            }
            // Extract text content from the raw line
            const dashPrefix = "-".repeat(nextToken.depth);
            let text = nextToken.raw.slice(dashPrefix.length).trimStart();
            // If it was tokenized as a container or other type, use key/value
            if (nextToken.type === TokenType.CONTAINER && nextToken.key) {
              text = nextToken.key;
            } else if (nextToken.type === TokenType.KEY_VALUE) {
              text = `${nextToken.key}: ${nextToken.value}`;
            }
            lines.push(text);
            i++;
          }

          const joinedValue = mode === "|" ? lines.join("\n") : lines.join(" ");

          const node: ASTNode = {
            type: "value",
            key: token.key,
            value: joinedValue,
            children: [],
            line: token.line,
            depth,
          };
          parent.children.push(node);
          break;
        }

        default:
          i++;
      }
    }

    return root;
  }

  private ensureArray(node: ASTNode): void {
    if (node.type !== "array" && node.type !== "root") {
      node.type = "array";
    }
  }
}

/**
 * Infer the JSON type from a string value.
 */
export function inferType(value: string): string | number | boolean | null {
  if (value === "") return "";

  // Quoted string — strip quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Boolean
  const lower = value.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;

  // Null
  if (lower === "null") return null;

  // Number
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  return value;
}

export class ParserError extends Error {
  line: number;

  constructor(message: string, line: number) {
    super(`${message} (line ${line})`);
    this.name = "ParserError";
    this.line = line;
  }
}
