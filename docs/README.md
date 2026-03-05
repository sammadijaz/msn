# MSN Documentation

Welcome to the official documentation for **Mad Sam Notation (MSN)**.

## What is MSN?

MSN is a token-efficient hierarchical data language that compiles directly to JSON. It was designed to minimize token usage in AI/LLM workflows while remaining human-readable and writable.

## Quick Start

### Installation

```bash
npm install @msn/parser
```

### Basic Usage

```typescript
import { compile } from "@msn/parser";

const msn = `
- name: My App
- version: 1.0.0
- server
-- host: localhost
-- port: 3000
`;

const json = compile(msn);
console.log(json);
// { name: "My App", version: "1.0.0", server: { host: "localhost", port: 3000 } }
```

## Table of Contents

1. [Getting Started](getting-started.md)
2. [Language Syntax](syntax.md)
3. [API Reference](api-reference.md)
4. [CLI Usage](cli.md)
5. [Contributing](contributing.md)

## Core Concepts

### Hierarchy via Dashes

MSN uses dash prefixes for nesting:

```msn
- level1         # depth 1
-- level2        # depth 2
--- level3       # depth 3
```

### Key-Value Pairs

```msn
- key: value
```

### Arrays

```msn
- items
-- * first
-- * second
-- * third
```

### Comments

```msn
# Full line comment
- key: value  # Inline comment
```
