import type { ValidationError } from "@msn/parser";

/**
 * Validate MSN source text and return an array of errors.
 * Returns an empty array if the source is valid.
 */
export function validate(source: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = source.split(/\r?\n/);

  let prevDepth = 0;
  let prevLineIndex = -1;
  let inMultiline = false;
  let multilineDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNum = i + 1;
    const trimmed = raw.trim();

    // Skip blank lines
    if (trimmed === "") continue;

    // Skip comments
    if (trimmed.startsWith("#")) continue;

    // If in multiline, check continuation depth
    if (inMultiline) {
      const dashMatch = raw.match(/^(-+)\s/);
      if (dashMatch) {
        const depth = dashMatch[1].length;
        if (depth === multilineDepth) {
          continue; // valid continuation
        }
      }
      // End of multiline block
      inMultiline = false;
    }

    // Must start with dashes
    const dashMatch = raw.match(/^(-+)(.*)/);
    if (!dashMatch) {
      errors.push({
        message: `Line must start with one or more dashes (-), got: "${trimmed.slice(0, 30)}${trimmed.length > 30 ? "..." : ""}"`,
        line: lineNum,
        column: 1,
        severity: "error",
      });
      continue;
    }

    const dashes = dashMatch[1];
    const afterDashes = dashMatch[2];
    const depth = dashes.length;

    // Must have space after dashes
    if (afterDashes.length > 0 && afterDashes[0] !== " ") {
      errors.push({
        message: `Missing space after dash prefix at column ${depth + 1}`,
        line: lineNum,
        column: depth + 1,
        severity: "error",
      });
      continue;
    }

    // Depth increase validation
    if (prevLineIndex >= 0 && depth > prevDepth + 1) {
      errors.push({
        message: `Depth increased by ${depth - prevDepth} (max increase is 1). Previous depth was ${prevDepth}, current is ${depth}`,
        line: lineNum,
        severity: "error",
      });
    }

    const content = afterDashes.trimStart();

    // Check for key-value with missing space after colon
    if (
      content.includes(":") &&
      !content.includes(": ") &&
      !content.endsWith(":")
    ) {
      const colonIdx = content.indexOf(":");
      const afterColon = content.slice(colonIdx + 1);
      if (afterColon.length > 0 && afterColon[0] !== " ") {
        errors.push({
          message: "Missing space after colon in key-value pair",
          line: lineNum,
          severity: "error",
        });
      }
    }

    // Detect multiline marker
    if (content.includes(": |") || content.includes(": >")) {
      inMultiline = true;
      multilineDepth = depth + 1;
    }

    prevDepth = depth;
    prevLineIndex = i;
  }

  return errors;
}

/**
 * Validate indentation consistency.
 */
export function validateIndentation(source: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNum = i + 1;
    const trimmed = raw.trim();

    if (trimmed === "" || trimmed.startsWith("#")) continue;

    // Check for leading whitespace before dashes
    if (raw !== raw.trimStart() && raw.trimStart().startsWith("-")) {
      errors.push({
        message:
          "Unexpected leading whitespace before dashes. MSN uses dash count for depth, not indentation",
        line: lineNum,
        severity: "warning",
      });
    }

    // Check for trailing whitespace
    if (raw !== raw.trimEnd()) {
      errors.push({
        message: "Trailing whitespace detected",
        line: lineNum,
        severity: "warning",
      });
    }
  }

  return errors;
}

/**
 * Run all validations on source.
 */
export function validateAll(source: string): ValidationError[] {
  return [...validate(source), ...validateIndentation(source)];
}
