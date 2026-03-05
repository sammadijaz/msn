# MSN Syntax Guide

## Line Structure

Every MSN line follows one of these patterns:

```
- key: value          Key-value pair
- key                 Container (object)
-- * value            Array item
-- *                  Array object marker
# comment             Comment
                      Blank line (ignored)
```

## Depth / Nesting

The number of dashes determines the depth:

```msn
- root                 # depth 1
-- child               # depth 2
--- grandchild: value  # depth 3
```

**Rules:**

- Depth can increase by at most 1 per line
- Depth can decrease by any amount
- All lines must start with at least one dash

## Key-Value Pairs

```msn
- name: John
- age: 30
- active: true
- score: 95.5
- data: null
```

## Type Inference

| Value            | Type    | Example          |
| ---------------- | ------- | ---------------- |
| `42`             | number  | `- count: 42`    |
| `3.14`           | number  | `- pi: 3.14`     |
| `true` / `false` | boolean | `- active: true` |
| `null`           | null    | `- data: null`   |
| `"42"`           | string  | `- code: "42"`   |
| anything else    | string  | `- name: hello`  |

## Containers (Objects)

A key without a value creates a nested object:

```msn
- database
-- host: localhost
-- port: 5432
```

→ `{ "database": { "host": "localhost", "port": 5432 } }`

## Arrays

Use `*` to create array items:

```msn
- colors
-- * red
-- * green
-- * blue
```

→ `{ "colors": ["red", "green", "blue"] }`

## Array Objects

A bare `*` creates an object entry in an array:

```msn
- users
-- *
--- name: Alice
--- age: 30
-- *
--- name: Bob
--- age: 25
```

→ `{ "users": [{ "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 }] }`

## Multiline Values

### Literal Block (`|`)

Preserves line breaks:

```msn
- description: |
-- Line one
-- Line two
```

→ `{ "description": "Line one\nLine two" }`

### Folded Block (`>`)

Joins lines with spaces:

```msn
- summary: >
-- Part one
-- Part two
```

→ `{ "summary": "Part one Part two" }`

## Comments

```msn
# Full line comment
- name: value  # Inline comment
```

Comments are stripped during parsing.
