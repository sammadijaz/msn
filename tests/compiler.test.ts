import { describe, it, expect } from "vitest";
import { Compiler } from "../packages/parser/src/compiler";

describe("Compiler", () => {
  const compiler = new Compiler();

  it("should compile simple key-value pairs", () => {
    const result = compiler.compile(`- name: My App
- version: 1.0.0
- debug: false`);
    expect(result).toEqual({
      name: "My App",
      version: "1.0.0",
      debug: false,
    });
  });

  it("should compile nested objects", () => {
    const result = compiler.compile(`- server
-- host: localhost
-- port: 8080`);
    expect(result).toEqual({
      server: {
        host: "localhost",
        port: 8080,
      },
    });
  });

  it("should compile deep nesting (4+ levels)", () => {
    const result = compiler.compile(`- a
-- b
--- c
---- d: deep`);
    expect(result).toEqual({
      a: { b: { c: { d: "deep" } } },
    });
  });

  it("should compile very deep nesting (6 levels)", () => {
    const result = compiler.compile(`- level1
-- level2
--- level3
---- level4
----- level5
------ value: found`);
    expect(result).toEqual({
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: "found",
              },
            },
          },
        },
      },
    });
  });

  it("should compile simple arrays", () => {
    const result = compiler.compile(`- colors
-- * red
-- * green
-- * blue`);
    expect(result).toEqual({
      colors: ["red", "green", "blue"],
    });
  });

  it("should compile arrays with type inference", () => {
    const result = compiler.compile(`- values
-- * 42
-- * true
-- * null
-- * hello`);
    expect(result).toEqual({
      values: [42, true, null, "hello"],
    });
  });

  it("should compile array objects", () => {
    const result = compiler.compile(`- users
-- *
--- name: Alice
--- age: 30
-- *
--- name: Bob
--- age: 25`);
    expect(result).toEqual({
      users: [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ],
    });
  });

  it("should compile multiline literal values", () => {
    const result = compiler.compile(`- description: |
-- Hello World
-- Second line`);
    expect(result).toEqual({
      description: "Hello World\nSecond line",
    });
  });

  it("should compile multiline folded values", () => {
    const result = compiler.compile(`- summary: >
-- Hello World
-- Second line`);
    expect(result).toEqual({
      summary: "Hello World Second line",
    });
  });

  it("should ignore comments", () => {
    const result = compiler.compile(`# Top comment
- name: test # inline comment
# Middle comment
- value: 42`);
    expect(result).toEqual({
      name: "test",
      value: 42,
    });
  });

  it("should handle complex real-world config", () => {
    const result = compiler.compile(`- app
-- name: My Application
-- version: 2.0.0
-- debug: false
-- server
--- host: 0.0.0.0
--- port: 3000
-- database
--- host: db.example.com
--- port: 5432
--- credentials
---- username: admin
---- password: secret
-- features
--- * auth
--- * api
--- * logging`);
    expect(result).toEqual({
      app: {
        name: "My Application",
        version: "2.0.0",
        debug: false,
        server: {
          host: "0.0.0.0",
          port: 3000,
        },
        database: {
          host: "db.example.com",
          port: 5432,
          credentials: {
            username: "admin",
            password: "secret",
          },
        },
        features: ["auth", "api", "logging"],
      },
    });
  });

  it("should compile to formatted JSON string", () => {
    const result = compiler.compileToString("- name: test");
    expect(result).toBe('{\n  "name": "test"\n}');
  });

  it("should handle numeric values correctly", () => {
    const result = compiler.compile(`- integer: 42
- negative: -10
- float: 3.14
- negfloat: -0.5
- zero: 0`);
    expect(result).toEqual({
      integer: 42,
      negative: -10,
      float: 3.14,
      negfloat: -0.5,
      zero: 0,
    });
  });

  it("should handle boolean and null values", () => {
    const result = compiler.compile(`- active: true
- debug: false
- data: null`);
    expect(result).toEqual({
      active: true,
      debug: false,
      data: null,
    });
  });

  it("should preserve quoted strings", () => {
    const result = compiler.compile(`- code: "42"
- flag: "true"
- empty: "null"`);
    expect(result).toEqual({
      code: "42",
      flag: "true",
      empty: "null",
    });
  });
});
