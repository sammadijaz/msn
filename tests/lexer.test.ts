import { describe, it, expect } from "vitest";
import { Lexer } from "../packages/parser/src/lexer";
import { TokenType } from "../packages/parser/src/types";

describe("Lexer", () => {
  it("should tokenize a simple key-value pair", () => {
    const lexer = new Lexer("- name: hello");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.KEY_VALUE);
    expect(tokens[0].depth).toBe(1);
    expect(tokens[0].key).toBe("name");
    expect(tokens[0].value).toBe("hello");
  });

  it("should tokenize container nodes", () => {
    const lexer = new Lexer("- server");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.CONTAINER);
    expect(tokens[0].key).toBe("server");
    expect(tokens[0].depth).toBe(1);
  });

  it("should tokenize array items", () => {
    const lexer = new Lexer("-- * red");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.ARRAY_ITEM);
    expect(tokens[0].value).toBe("red");
    expect(tokens[0].depth).toBe(2);
  });

  it("should tokenize array objects", () => {
    const lexer = new Lexer("-- *");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.ARRAY_OBJECT);
    expect(tokens[0].depth).toBe(2);
  });

  it("should tokenize comments", () => {
    const lexer = new Lexer("# this is a comment");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.COMMENT);
  });

  it("should tokenize blank lines", () => {
    const lexer = new Lexer("");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.BLANK);
  });

  it("should handle multiline markers", () => {
    const lexer = new Lexer("- description: |");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.MULTILINE_MARKER);
    expect(tokens[0].key).toBe("description");
    expect(tokens[0].multilineMode).toBe("|");
  });

  it("should handle folded multiline markers", () => {
    const lexer = new Lexer("- summary: >");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.MULTILINE_MARKER);
    expect(tokens[0].multilineMode).toBe(">");
  });

  it("should strip inline comments", () => {
    const lexer = new Lexer("- name: hello # a comment");
    const tokens = lexer.tokenize();
    expect(tokens[0].value).toBe("hello");
  });

  it("should handle multiple depth levels", () => {
    const source = `- a
-- b: 1
--- c: 2
---- d: 3`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    expect(tokens.map((t) => t.depth)).toEqual([1, 2, 3, 4]);
  });

  it("should throw on invalid syntax", () => {
    const lexer = new Lexer("invalid line");
    expect(() => lexer.tokenize()).toThrow();
  });
});
