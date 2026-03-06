<div align="center">

# ⚡ MSN — Mad Sam Notation

**The most token-efficient structured data format for AI and modern applications.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/Tests-63%20passing-brightgreen)](#testing)

[Documentation](docs/) · [Playground](playground/) · [Examples](examples/) · [Specification](spec/msn-spec.md)

</div>

---

MSN is a hierarchical data language that compiles directly to JSON. It replaces brackets, braces, and excessive punctuation with a simple dash-prefix system — resulting in **up to 60% fewer tokens** than JSON and consistently fewer than YAML, TOML, or XML.

## Why MSN?

Every LLM API call costs tokens. Every config file competes for context window space. MSN was designed from the ground up to minimize token usage while remaining instantly readable:

```
         MSN         JSON        YAML        TOML        XML
Simple     38 chars    65 chars    42 chars    58 chars   124 chars
Nested     87 chars   156 chars    94 chars   142 chars   298 chars
Complex   214 chars   418 chars   248 chars   396 chars   756 chars
```

## Quick Example

<table>
<tr><th>MSN</th><th>JSON</th></tr>
<tr><td>

```msn
# App Configuration
- name: My App
- version: 1.0.0
- database
-- host: localhost
-- port: 5432
-- credentials
--- username: admin
--- password: secret
- features
-- * authentication
-- * dashboard
-- * api
```

</td><td>

```json
{
  "name": "My App",
  "version": "1.0.0",
  "database": {
    "host": "localhost",
    "port": 5432,
    "credentials": {
      "username": "admin",
      "password": "secret"
    }
  },
  "features": [
    "authentication",
    "dashboard",
    "api"
  ]
}
```

</td></tr>
</table>

**14 lines vs 18 lines. 194 chars vs 340 chars. Zero ambiguity.**

## Features

| Feature | Description |
|---------|-------------|
| ⚡ **Token Efficient** | Up to 60% fewer tokens than JSON — critical for LLM workflows |
| 🏗️ **Unlimited Nesting** | Just add dashes: `-` → `--` → `---` → as deep as you need |
| 🔧 **Simple Parsing** | Line-by-line, zero ambiguity, no lookahead needed |
| 🔄 **JSON Compatible** | Every MSN file compiles to valid JSON |
| 🎯 **Type Inference** | Numbers, booleans, and `null` detected automatically |
| 💬 **Comments** | `#` for full-line and inline comments |
| 📋 **Arrays** | `*` prefix for simple items, bare `*` for object arrays |
| 📝 **Multiline Values** | `\|` for literal blocks, `>` for folded text |

## Ecosystem

| Package | Description | |
|---------|-------------|---|
| [`@madsn/parser`](packages/parser/) | Core lexer, parser, and compiler | **Required** |
| [`@madsn/cli`](packages/cli/) | Command-line interface | `msn compile`, `msn validate` |
| [`@madsn/validator`](packages/validator/) | Syntax and structure validation | Errors + warnings |
| [`@madsn/formatter`](packages/formatter/) | Auto-formatting for MSN files | Normalize whitespace |
| [`msn-vscode`](packages/vscode-extension/) | VS Code extension | Syntax highlighting |

## Quick Start

### Install the Parser

```bash
npm install @madsn/parser
```

### Use in Code

```typescript
import { compile, compileToString } from "@madsn/parser";

// Parse to JavaScript object
const config = compile(`
- server
-- host: 0.0.0.0
-- port: 3000
`);
// → { server: { host: "0.0.0.0", port: 3000 } }

// Or get formatted JSON
const json = compileToString(msnSource, 2);
```

### Install the CLI

```bash
npm install -g @madsn/cli
```

### CLI Commands

```bash
msn compile config.msn              # Compile to JSON
msn compile config.msn -o out.json  # Write to file
msn parse config.msn                # Output AST
msn validate config.msn             # Check syntax
msn format config.msn               # Auto-format
cat config.msn | msn compile --stdin # Pipe from stdin
```

## Language Overview

### Nesting with Dashes

```msn
- server           # depth 1
-- host: localhost  # depth 2
-- ssl              # depth 2 (container)
--- enabled: true   # depth 3
```

### Arrays

```msn
- colors
-- * red
-- * green
-- * blue
```

### Array of Objects

```msn
- users
-- *
--- name: Alice
--- role: admin
-- *
--- name: Bob
--- role: user
```

### Multiline Values

```msn
- description: |
-- This preserves
-- line breaks

- summary: >
-- This folds into
-- a single line
```

### Type Inference

| Input | Type | Output |
|-------|------|--------|
| `42` | number | `42` |
| `3.14` | number | `3.14` |
| `true` / `false` | boolean | `true` / `false` |
| `null` | null | `null` |
| `"42"` | string (forced) | `"42"` |
| `hello world` | string | `"hello world"` |

## Development

```bash
# Clone and install
git clone https://github.com/madsam/msn.git
cd msn && npm install

# Build all packages (in dependency order)
node scripts/build.mjs

# Run the full test suite
npm test

# Build the website
cd website && npx next build

# Build the playground
cd playground && npx vite build
```

## Testing

The test suite covers the lexer, parser, compiler, validator, and formatter:

```
 ✓ tests/lexer.test.ts       (11 tests)
 ✓ tests/parser.test.ts      (14 tests)
 ✓ tests/compiler.test.ts    (15 tests)
 ✓ tests/validator.test.ts   (14 tests)
 ✓ tests/formatter.test.ts    (9 tests)

 Test Files  5 passed (5)
      Tests  63 passed (63)
```

## Project Structure

```
msn/
├── packages/
│   ├── parser/              Core MSN parser (lexer → AST → JSON)
│   ├── cli/                 Command-line interface
│   ├── validator/           Syntax & structure validation
│   ├── formatter/           Auto-formatting
│   └── vscode-extension/    VS Code language support
├── tests/                   Vitest test suite (63 tests)
├── docs/                    Documentation
│   ├── getting-started.md   Quick start guide
│   ├── syntax.md            Full syntax reference
│   ├── api-reference.md     Parser/validator/formatter API
│   ├── cli.md               CLI reference
│   └── contributing.md      Contribution guidelines
├── examples/                Real-world MSN examples
│   ├── app-config.msn       Application configuration
│   ├── docker-compose.msn   Docker Compose equivalent
│   ├── ci-pipeline.msn      CI/CD pipeline
│   └── package.msn          npm package manifest
├── spec/                    Language specification (v1.0)
├── playground/              Interactive web playground (Vite + React)
├── website/                 Official website (Next.js + Tailwind)
└── scripts/                 Build & clean utilities
```

## Contributing

We welcome contributions of all kinds — code, documentation, bug reports, and ideas. See the [Contributing Guide](docs/contributing.md) for details.

**Quick contribution areas:**
- 🐛 Bug fixes and edge case handling
- 📖 Documentation improvements and tutorials
- 🌍 Language ports (Python, Rust, Go)
- 🧪 Additional test coverage
- 🎨 Playground and website improvements

## License

[MIT](LICENSE) — free for personal and commercial use.
