# API Reference

## `@msn/parser`

### `compile(source: string): JsonValue`

Compiles MSN source text to a JSON-compatible value.

```typescript
import { compile } from "@msn/parser";

const result = compile("- name: hello");
// { name: "hello" }
```

### `compileToString(source: string, indent?: number): string`

Compiles MSN source and returns a formatted JSON string.

```typescript
import { compileToString } from "@msn/parser";

const json = compileToString("- name: hello", 2);
// '{\n  "name": "hello"\n}'
```

### `class Lexer`

Tokenizes MSN source into a stream of tokens.

```typescript
import { Lexer } from "@msn/parser";

const lexer = new Lexer("- name: hello");
const tokens = lexer.tokenize();
```

### `class Parser`

Parses MSN source into an AST.

```typescript
import { Parser } from "@msn/parser";

const parser = new Parser();
const ast = parser.parse("- name: hello");
```

### `class Compiler`

Converts AST to JSON.

```typescript
import { Compiler } from "@msn/parser";

const compiler = new Compiler();
const json = compiler.compile("- name: hello");
const jsonString = compiler.compileToString("- name: hello", 2);
```

### `inferType(value: string): string | number | boolean | null`

Infers the JSON type from a string value.

```typescript
import { inferType } from "@msn/parser";

inferType("42"); // 42
inferType("true"); // true
inferType("null"); // null
inferType("hello"); // "hello"
inferType('"42"'); // "42"
```

## `@msn/validator`

### `validate(source: string): ValidationError[]`

Validates MSN syntax and returns an array of errors.

```typescript
import { validate } from "@msn/validator";

const errors = validate("- name: hello");
// []
```

### `validateIndentation(source: string): ValidationError[]`

Checks for indentation issues (warnings).

### `validateAll(source: string): ValidationError[]`

Runs all validation checks.

## `@msn/formatter`

### `format(source: string, options?: FormatOptions): string`

Formats MSN source text.

```typescript
import { format } from "@msn/formatter";

const formatted = format("  -  name:  hello  ");
// '- name: hello\n'
```

#### `FormatOptions`

| Option             | Type    | Default | Description                |
| ------------------ | ------- | ------- | -------------------------- |
| `finalNewline`     | boolean | `true`  | Add newline at end of file |
| `removeBlankLines` | boolean | `false` | Remove blank lines         |

## Types

### `Token`

```typescript
interface Token {
  type: TokenType;
  depth: number;
  key?: string;
  value?: string;
  raw: string;
  line: number;
  multilineMode?: "|" | ">";
}
```

### `ASTNode`

```typescript
interface ASTNode {
  type: "object" | "array" | "value" | "array-item" | "root";
  key?: string;
  value?: JsonValue;
  children: ASTNode[];
  line?: number;
  depth?: number;
}
```

### `ValidationError`

```typescript
interface ValidationError {
  message: string;
  line: number;
  column?: number;
  severity: "error" | "warning";
}
```
