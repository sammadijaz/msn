import { describe, it, expect } from "vitest";
import { Compiler } from "../packages/parser/src/compiler";
import { Lexer, LexerError } from "../packages/parser/src/lexer";
import { Parser, inferType } from "../packages/parser/src/parser";
import { validate, validateAll } from "../packages/validator/src/index";
import { format } from "../packages/formatter/src/index";

describe("Edge Cases — Compiler", () => {
  const compiler = new Compiler();

  it("should handle empty input", () => {
    const result = compiler.compile("");
    expect(result).toEqual({});
  });

  it("should handle input with only comments", () => {
    const result = compiler.compile(`# just a comment
# and another`);
    expect(result).toEqual({});
  });

  it("should handle input with only blank lines", () => {
    const result = compiler.compile(`

`);
    expect(result).toEqual({});
  });

  it("should handle value with colon inside (URL)", () => {
    const result = compiler.compile(`- url: https://example.com`);
    expect(result).toEqual({ url: "https://example.com" });
  });

  it("should handle value with multiple colons", () => {
    const result = compiler.compile(`- time: 12:30:45`);
    expect(result).toEqual({ time: "12:30:45" });
  });

  it("should handle empty container with no children", () => {
    const result = compiler.compile(`- empty
- name: test`);
    expect(result).toEqual({ empty: {}, name: "test" });
  });

  it("should handle deeply nested then returning to root", () => {
    const result = compiler.compile(`- a
-- b
--- c
---- d: deep
- back: root`);
    expect(result).toEqual({
      a: { b: { c: { d: "deep" } } },
      back: "root",
    });
  });

  it("should handle adjacent arrays", () => {
    const result = compiler.compile(`- colors
-- * red
-- * blue
- sizes
-- * small
-- * large`);
    expect(result).toEqual({
      colors: ["red", "blue"],
      sizes: ["small", "large"],
    });
  });

  it("should handle nested arrays inside objects", () => {
    const result = compiler.compile(`- config
-- tags
--- * alpha
--- * beta
-- settings
--- debug: true`);
    expect(result).toEqual({
      config: {
        tags: ["alpha", "beta"],
        settings: { debug: true },
      },
    });
  });

  it("should handle array of objects with nested arrays", () => {
    const result = compiler.compile(`- users
-- *
--- name: Alice
--- roles
---- * admin
---- * editor
-- *
--- name: Bob
--- roles
---- * viewer`);
    expect(result).toEqual({
      users: [
        { name: "Alice", roles: ["admin", "editor"] },
        { name: "Bob", roles: ["viewer"] },
      ],
    });
  });

  it("should handle quoted string that looks like a number", () => {
    const result = compiler.compile(`- zip: "10001"
- flag: "true"
- nothing: "null"`);
    expect(result).toEqual({
      zip: "10001",
      flag: "true",
      nothing: "null",
    });
  });

  it("should handle negative numbers", () => {
    const result = compiler.compile(`- temp: -40
- offset: -3.5`);
    expect(result).toEqual({ temp: -40, offset: -3.5 });
  });

  it("should handle value of zero", () => {
    const result = compiler.compile(`- count: 0
- rate: 0.0`);
    expect(result).toEqual({ count: 0, rate: 0 });
  });

  it("should handle keys with special characters", () => {
    const result = compiler.compile(`- Content-Type: application/json
- x-api-key: abc123`);
    expect(result).toEqual({
      "Content-Type": "application/json",
      "x-api-key": "abc123",
    });
  });

  it("should handle single-item arrays", () => {
    const result = compiler.compile(`- items
-- * only`);
    expect(result).toEqual({ items: ["only"] });
  });

  it("should compile a mix of everything", () => {
    const result = compiler.compile(`# Full test
- app
-- name: Test
-- version: 2.0.0
-- debug: false
-- server
--- host: 0.0.0.0
--- port: 443
--- ssl
---- enabled: true
-- db
--- creds
---- user: admin
---- pass: "s3cret"
-- tags
--- * prod
--- * v2
- meta: null`);
    expect(result).toEqual({
      app: {
        name: "Test",
        version: "2.0.0",
        debug: false,
        server: {
          host: "0.0.0.0",
          port: 443,
          ssl: { enabled: true },
        },
        db: {
          creds: { user: "admin", pass: "s3cret" },
        },
        tags: ["prod", "v2"],
      },
      meta: null,
    });
  });
});

describe("Edge Cases — Lexer", () => {
  it("should handle Windows-style line endings (CRLF)", () => {
    const lexer = new Lexer("- name: hello\r\n- age: 42");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(2);
    expect(tokens[0].value).toBe("hello");
    expect(tokens[1].value).toBe("42");
  });

  it("should not strip hash inside quoted value", () => {
    const lexer = new Lexer(`- color: "#ff0000"`);
    const tokens = lexer.tokenize();
    expect(tokens[0].value).toBe('"#ff0000"');
  });

  it("should throw on line without dashes or comment", () => {
    const lexer = new Lexer("bare text");
    expect(() => lexer.tokenize()).toThrow(LexerError);
  });

  it("should handle many dashes", () => {
    const lexer = new Lexer("---------- deep: value");
    const tokens = lexer.tokenize();
    expect(tokens[0].depth).toBe(10);
    expect(tokens[0].key).toBe("deep");
  });
});

describe("Edge Cases — inferType", () => {
  it("should infer large integers", () => {
    expect(inferType("999999999")).toBe(999999999);
  });

  it("should NOT infer hex as number", () => {
    expect(inferType("0xFF")).toBe("0xFF");
  });

  it("should NOT infer scientific notation as number", () => {
    expect(inferType("1e10")).toBe("1e10");
  });

  it("should handle strings that look almost numeric", () => {
    expect(inferType("12.34.56")).toBe("12.34.56");
    expect(inferType("12px")).toBe("12px");
    expect(inferType("v1.0.0")).toBe("v1.0.0");
  });

  it("should handle single-quoted strings", () => {
    expect(inferType("'hello'")).toBe("hello");
  });

  it("should handle case-insensitive true/false/null", () => {
    expect(inferType("True")).toBe(true);
    expect(inferType("FALSE")).toBe(false);
    expect(inferType("Null")).toBe(null);
    expect(inferType("NULL")).toBe(null);
  });
});

describe("Edge Cases — Validator", () => {
  it("should return no errors for empty input", () => {
    expect(validate("")).toHaveLength(0);
  });

  it("should return no errors for only comments", () => {
    expect(validate("# just a comment")).toHaveLength(0);
  });

  it("should detect multiple errors in one file", () => {
    const errors = validate(`not a line
- valid: yes
also invalid`);
    expect(errors.length).toBe(2);
  });

  it("should allow depth going from 3 back to 1", () => {
    const errors = validate(`- a
-- b
--- c: deep
- d: back`);
    expect(errors).toHaveLength(0);
  });

  it("should detect depth jump of 3", () => {
    const errors = validate(`- a
---- too-deep: yes`);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("Edge Cases — Formatter", () => {
  it("should handle empty input", () => {
    const result = format("");
    expect(result).toBe("\n");
  });

  it("should handle only comments", () => {
    const result = format("  # indented comment");
    expect(result).toBe("# indented comment\n");
  });

  it("should normalize key:value without space after colon", () => {
    const result = format("- port:8080");
    expect(result).toBe("- port: 8080\n");
  });

  it("should handle multiple blank lines", () => {
    const result = format(`- a: 1


- b: 2`, { removeBlankLines: true });
    expect(result).toBe("- a: 1\n- b: 2\n");
  });

  it("should strip trailing whitespace from all lines", () => {
    const result = format(`- name: hello     
-- port: 3000   `);
    expect(result).not.toContain("     ");
  });
});

describe("Integration — Round-trip Consistency", () => {
  const compiler = new Compiler();

  it("should produce same output for formatted vs unformatted input", () => {
    const messy = `-  name:  My App
--  port:   3000
-- debug:  true`;
    const clean = `- name: My App
-- port: 3000
-- debug: true`;
    expect(compiler.compile(messy)).toEqual(compiler.compile(clean));
  });

  it("should handle all the example files patterns", () => {
    // CI pipeline pattern: deeply nested array objects
    const ci = `- jobs
-- test
--- steps
---- *
----- name: Build
----- run: npm run build`;
    const result = compiler.compile(ci);
    expect(result).toEqual({
      jobs: {
        test: {
          steps: [{ name: "Build", run: "npm run build" }],
        },
      },
    });
  });
});
