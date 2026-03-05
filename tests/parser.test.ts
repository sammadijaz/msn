import { describe, it, expect } from "vitest";
import { Parser, inferType } from "../packages/parser/src/parser";

describe("Parser", () => {
  const parser = new Parser();

  it("should parse a simple key-value pair", () => {
    const ast = parser.parse("- name: hello");
    expect(ast.type).toBe("root");
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0].key).toBe("name");
    expect(ast.children[0].value).toBe("hello");
  });

  it("should parse nested objects", () => {
    const ast = parser.parse(`- server
-- host: localhost
-- port: 8080`);
    expect(ast.children).toHaveLength(1);
    const server = ast.children[0];
    expect(server.key).toBe("server");
    expect(server.type).toBe("object");
    expect(server.children).toHaveLength(2);
    expect(server.children[0].key).toBe("host");
    expect(server.children[0].value).toBe("localhost");
    expect(server.children[1].key).toBe("port");
    expect(server.children[1].value).toBe(8080);
  });

  it("should parse simple arrays", () => {
    const ast = parser.parse(`- colors
-- * red
-- * green
-- * blue`);
    const colors = ast.children[0];
    expect(colors.key).toBe("colors");
    expect(colors.type).toBe("array");
    expect(colors.children).toHaveLength(3);
  });

  it("should parse array objects", () => {
    const ast = parser.parse(`- users
-- *
--- name: Alice
--- age: 30
-- *
--- name: Bob
--- age: 25`);
    const users = ast.children[0];
    expect(users.type).toBe("array");
    expect(users.children).toHaveLength(2);
    expect(users.children[0].children[0].key).toBe("name");
    expect(users.children[0].children[0].value).toBe("Alice");
  });

  it("should handle multiline literal values", () => {
    const ast = parser.parse(`- description: |
-- line one
-- line two
-- line three`);
    expect(ast.children[0].key).toBe("description");
    expect(ast.children[0].value).toBe("line one\nline two\nline three");
  });

  it("should handle multiline folded values", () => {
    const ast = parser.parse(`- summary: >
-- line one
-- line two
-- line three`);
    expect(ast.children[0].key).toBe("summary");
    expect(ast.children[0].value).toBe("line one line two line three");
  });

  it("should skip comments", () => {
    const ast = parser.parse(`# a comment
- name: hello
# another comment
- age: 42`);
    expect(ast.children).toHaveLength(2);
  });
});

describe("inferType", () => {
  it("should infer integers", () => {
    expect(inferType("42")).toBe(42);
    expect(inferType("-10")).toBe(-10);
    expect(inferType("0")).toBe(0);
  });

  it("should infer floats", () => {
    expect(inferType("3.14")).toBe(3.14);
    expect(inferType("-0.5")).toBe(-0.5);
  });

  it("should infer booleans", () => {
    expect(inferType("true")).toBe(true);
    expect(inferType("false")).toBe(false);
    expect(inferType("True")).toBe(true);
    expect(inferType("FALSE")).toBe(false);
  });

  it("should infer null", () => {
    expect(inferType("null")).toBe(null);
    expect(inferType("NULL")).toBe(null);
  });

  it("should return strings for other values", () => {
    expect(inferType("hello")).toBe("hello");
    expect(inferType("foo bar")).toBe("foo bar");
  });

  it("should strip quotes from quoted strings", () => {
    expect(inferType('"42"')).toBe("42");
    expect(inferType("'hello'")).toBe("hello");
  });

  it("should return empty string for empty input", () => {
    expect(inferType("")).toBe("");
  });
});
