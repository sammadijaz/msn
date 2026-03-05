# MSN — Mad Sam Notation

**The most token-efficient structured data format for AI and modern applications.**

MSN is a hierarchical data language that compiles directly to JSON. It uses a simple dash-prefix system for nesting, making it dramatically more token-efficient than JSON, YAML, or TOML.

## Quick Example

```msn
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

Compiles to:

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
  "features": ["authentication", "dashboard", "api"]
}
```

## Features

- **Token Efficient** — Up to 60% fewer tokens than JSON
- **Unlimited Nesting** — Use dash prefixes for any depth
- **Simple Parsing** — Line-by-line, no ambiguity
- **JSON Compatible** — Compiles directly to valid JSON
- **Type Inference** — Numbers, booleans, null auto-detected
- **Comments** — Use `#` for inline and block comments
- **Arrays** — Use `*` prefix for array items
- **Multiline Values** — Use `|` for block text

## Packages

| Package          | Description                      |
| ---------------- | -------------------------------- |
| `@msn/parser`    | Core parser, lexer, and compiler |
| `@msn/cli`       | Command-line interface           |
| `@msn/validator` | Syntax and structure validation  |
| `@msn/formatter` | Auto-formatting for MSN files    |
| `msn-vscode`     | VS Code extension                |

## Installation

```bash
npm install @msn/parser
```

For the CLI:

```bash
npm install -g @msn/cli
```

## CLI Usage

```bash
# Compile MSN to JSON
msn compile config.msn

# Parse and output AST
msn parse config.msn

# Validate MSN file
msn validate config.msn

# Format MSN file
msn format config.msn

# Read from stdin
cat config.msn | msn compile
```

## Development

```bash
# Clone the repository
git clone https://github.com/madsam/msn.git
cd msn

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Project Structure

```
msn/
├── packages/
│   ├── parser/       Core MSN parser
│   ├── cli/          Command-line interface
│   ├── validator/    Syntax validator
│   ├── formatter/    Auto-formatter
│   └── vscode-extension/  VS Code support
├── docs/             Documentation
├── examples/         Example MSN files
├── playground/       Web playground
├── website/          Official website
├── spec/             Language specification
├── tests/            Test suite
└── scripts/          Build and utility scripts
```

## Contributing

We welcome contributions! Please see the [Contributing Guide](docs/contributing.md) for details.

## License

[MIT](LICENSE)
