import { describe, it, expect } from "vitest";
import { format } from "../packages/formatter/src/index";

describe("Formatter", () => {
  it("should normalize leading whitespace", () => {
    const result = format(`  - name: hello`);
    expect(result).toBe("- name: hello\n");
  });

  it("should remove trailing whitespace", () => {
    const result = format(`- name: hello   `);
    expect(result).toBe("- name: hello\n");
  });

  it("should normalize spacing after dashes", () => {
    const result = format(`-  name: hello`);
    expect(result).toBe("- name: hello\n");
  });

  it("should handle array items", () => {
    const result = format(`-- *red`);
    expect(result).toBe("-- * red\n");
  });

  it("should preserve comments", () => {
    const result = format(`# this is a comment
- name: hello`);
    expect(result).toBe("# this is a comment\n- name: hello\n");
  });

  it("should preserve blank lines by default", () => {
    const result = format(`- name: hello

- age: 42`);
    expect(result).toBe("- name: hello\n\n- age: 42\n");
  });

  it("should remove blank lines when option set", () => {
    const result = format(
      `- name: hello

- age: 42`,
      { removeBlankLines: true },
    );
    expect(result).toBe("- name: hello\n- age: 42\n");
  });

  it("should add final newline", () => {
    const result = format(`- name: hello`);
    expect(result.endsWith("\n")).toBe(true);
  });

  it("should format complex MSN", () => {
    const result = format(`  - server
  --  host:   localhost
  -- port:8080
  --- ssl
  ----  enabled:  true`);
    expect(result).toContain("- server");
    expect(result).toContain("-- host: localhost");
  });
});
