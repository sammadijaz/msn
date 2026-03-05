# CLI Reference

## Installation

```bash
npm install -g @msn/cli
```

## Commands

### `msn compile <file>`

Compile an MSN file to JSON.

```bash
msn compile config.msn
msn compile config.msn --indent 4
msn compile config.msn --output config.json
```

### `msn parse <file>`

Parse an MSN file and output the AST.

```bash
msn parse config.msn
```

### `msn validate <file>`

Validate an MSN file for syntax errors.

```bash
msn validate config.msn
```

### `msn format <file>`

Format an MSN file.

```bash
msn format config.msn
msn format config.msn --output formatted.msn
```

## Options

| Option            | Description                    |
| ----------------- | ------------------------------ |
| `--indent <n>`    | JSON indent level (default: 2) |
| `--output <file>` | Write output to file           |
| `--stdin`         | Read from stdin                |
| `--help`          | Show help                      |
| `--version`       | Show version                   |

## Stdin Input

```bash
cat config.msn | msn compile --stdin
echo "- name: test" | msn compile --stdin
```
