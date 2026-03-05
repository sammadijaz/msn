import { describe, it, expect } from "vitest";
import {
  validate,
  validateIndentation,
  validateAll,
} from "../packages/validator/src/index";

describe("Validator", () => {
  it("should return no errors for valid MSN", () => {
    const errors = validate(`- name: hello
- age: 42
- server
-- host: localhost
-- port: 8080`);
    expect(errors).toHaveLength(0);
  });

  it("should detect lines not starting with dashes", () => {
    const errors = validate(`- name: hello
invalid line
- age: 42`);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("dashes");
  });

  it("should detect depth increase greater than 1", () => {
    const errors = validate(`- name: hello
--- deep: value`);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Depth");
  });

  it("should detect missing space after dashes", () => {
    const errors = validate(`-name: hello`);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("space");
  });

  it("should allow comments", () => {
    const errors = validate(`# comment
- name: hello
# another comment`);
    expect(errors).toHaveLength(0);
  });

  it("should allow blank lines", () => {
    const errors = validate(`- name: hello

- age: 42`);
    expect(errors).toHaveLength(0);
  });

  it("should allow depth decrease by any amount", () => {
    const errors = validate(`- a
-- b
--- c: deep
- d: back`);
    expect(errors).toHaveLength(0);
  });

  it("should validate arrays", () => {
    const errors = validate(`- items
-- * one
-- * two
-- * three`);
    expect(errors).toHaveLength(0);
  });

  it("should validate array objects", () => {
    const errors = validate(`- users
-- *
--- name: Alice
-- *
--- name: Bob`);
    expect(errors).toHaveLength(0);
  });

  it("should validate multiline blocks", () => {
    const errors = validate(`- description: |
-- Line one
-- Line two`);
    expect(errors).toHaveLength(0);
  });
});

describe("validateIndentation", () => {
  it("should warn about leading whitespace", () => {
    const errors = validateIndentation(`  - name: hello`);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].severity).toBe("warning");
  });

  it("should warn about trailing whitespace", () => {
    const errors = validateIndentation(`- name: hello   `);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should return no warnings for clean MSN", () => {
    const errors = validateIndentation(`- name: hello
- age: 42`);
    expect(errors).toHaveLength(0);
  });
});

describe("validateAll", () => {
  it("should combine syntax and indentation errors", () => {
    const errors = validateAll(`  -name: hello`);
    expect(errors.length).toBeGreaterThan(0);
  });
});
