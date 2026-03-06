# Getting Started with MSN

## Installation

### Parser Library

```bash
npm install @madsn/parser
```

### CLI Tool

```bash
npm install -g @madsn/cli
```

### VS Code Extension

Search for "MSN" in the VS Code extensions marketplace, or install `msn-vscode`.

## Your First MSN File

Create a file called `config.msn`:

```msn
- name: My Application
- version: 1.0.0
- server
-- host: localhost
-- port: 3000
```

## Compile to JSON

### Using the CLI

```bash
msn compile config.msn
```

Output:

```json
{
  "name": "My Application",
  "version": "1.0.0",
  "server": {
    "host": "localhost",
    "port": 3000
  }
}
```

### Using the Library

```typescript
import { compile } from "@madsn/parser";
import { readFileSync } from "fs";

const source = readFileSync("config.msn", "utf-8");
const json = compile(source);
```

## Next Steps

- Read the [Syntax Guide](syntax.md) for the full language reference
- See [Examples](../examples/) for real-world use cases
- Try the [Playground](../playground/) for interactive editing
