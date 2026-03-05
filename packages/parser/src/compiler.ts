import { ASTNode, JsonValue } from "./types.js";
import { Parser } from "./parser.js";

/**
 * MSN Compiler — Converts AST to JSON.
 */
export class Compiler {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  /**
   * Compile MSN source to a JSON value.
   */
  compile(source: string): JsonValue {
    const ast = this.parser.parse(source);
    return this.astToJson(ast);
  }

  /**
   * Compile MSN source and return formatted JSON string.
   */
  compileToString(source: string, indent: number = 2): string {
    const json = this.compile(source);
    return JSON.stringify(json, null, indent);
  }

  /**
   * Convert an AST node to its JSON representation.
   */
  astToJson(node: ASTNode): JsonValue {
    switch (node.type) {
      case "root":
        return this.buildObject(node.children);

      case "object":
        if (node.children.length === 0) {
          return {};
        }
        // Check if children are array items
        const hasArrayItems = node.children.some(
          (c) => c.type === "array-item" || (c.type === "object" && !c.key),
        );
        if (hasArrayItems) {
          return this.buildArray(node.children);
        }
        return this.buildObject(node.children);

      case "array":
        return this.buildArray(node.children);

      case "value":
        return node.value as JsonValue;

      case "array-item":
        if (node.children.length > 0) {
          return this.buildObject(node.children);
        }
        return node.value as JsonValue;

      default:
        return null;
    }
  }

  private buildObject(children: ASTNode[]): JsonValue {
    const obj: { [key: string]: JsonValue } = {};

    for (const child of children) {
      if (!child.key) continue;

      switch (child.type) {
        case "value":
          obj[child.key] = child.value as JsonValue;
          break;

        case "object":
          obj[child.key] = this.astToJson(child);
          break;

        case "array":
          obj[child.key] = this.buildArray(child.children);
          break;

        default:
          obj[child.key] = this.astToJson(child);
      }
    }

    return obj;
  }

  private buildArray(children: ASTNode[]): JsonValue[] {
    const arr: JsonValue[] = [];

    for (const child of children) {
      switch (child.type) {
        case "array-item":
          if (child.children.length > 0) {
            arr.push(this.buildObject(child.children));
          } else {
            arr.push(child.value as JsonValue);
          }
          break;

        case "object":
          if (!child.key) {
            // Array object entry
            arr.push(this.buildObject(child.children));
          } else {
            arr.push(this.astToJson(child));
          }
          break;

        case "value":
          arr.push(child.value as JsonValue);
          break;

        default:
          arr.push(this.astToJson(child));
      }
    }

    return arr;
  }
}
