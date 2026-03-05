# MSN Language Specification

## Mad Sam Notation — Version 1.0

### 1. Overview

Mad Sam Notation (MSN) is a token-efficient hierarchical data language that compiles directly to JSON. It uses dash-prefix depth to represent nesting, eliminating the need for braces, brackets, and excessive punctuation.

### 2. Design Goals

- Minimize token count for AI/LLM workflows
- Maintain full JSON compatibility
- Provide unambiguous parsing with simple rules
- Support unlimited nesting depth
- Be human-readable and writable

---

### 3. Hierarchy Rules

MSN uses dash prefixes to indicate depth level. Each additional dash increases the nesting depth by one.

```
Level 0: - key: value           (1 dash)
Level 1: -- key: value          (2 dashes)
Level 2: --- key: value         (3 dashes)
Level N: -...N dashes... key    (N dashes)
```

#### Rules

1. Every line MUST start with one or more dashes `-`
2. The number of dashes determines the depth level
3. A line with N dashes is a child of the nearest preceding line with N-1 dashes
4. The depth difference between consecutive lines MUST NOT increase by more than 1
5. The depth MAY decrease by any amount (closing multiple levels)

#### Example

```msn
- server
-- host: localhost
-- port: 8080
-- ssl
--- enabled: true
--- cert: /path/to/cert.pem
--- key: /path/to/key.pem
```

Compiles to:

```json
{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": {
      "enabled": true,
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    }
  }
}
```

---

### 4. Key-Value Pairs

A key-value pair is written as:

```
- key: value
```

#### Rules

1. The key follows the dash prefix, separated by a space
2. The colon `:` separates the key from the value
3. There MUST be a space after the colon
4. Keys MUST NOT contain colons (unless escaped)
5. Keys with no value and no colon create an object container
6. Keys are case-sensitive

#### Container Nodes

A line with only a key (no colon, no value) creates an object that contains its children:

```msn
- database
-- host: localhost
-- port: 5432
```

```json
{
  "database": {
    "host": "localhost",
    "port": 5432
  }
}
```

---

### 5. Arrays

Arrays are denoted using the `*` (asterisk) prefix after the dashes.

#### Simple Arrays

```msn
- colors
-- * red
-- * green
-- * blue
```

```json
{
  "colors": ["red", "green", "blue"]
}
```

#### Rules

1. Array items use `*` after the dash prefix: `-- * value`
2. There MUST be a space after the `*`
3. All array items under a parent MUST be at the same depth
4. Array items inherit type inference

---

### 6. Array Objects

Array items can contain nested objects by adding children at a deeper level:

```msn
- users
-- *
--- name: Alice
--- age: 30
--- role: admin
-- *
--- name: Bob
--- age: 25
--- role: user
```

```json
{
  "users": [
    {
      "name": "Alice",
      "age": 30,
      "role": "admin"
    },
    {
      "name": "Bob",
      "age": 25,
      "role": "user"
    }
  ]
}
```

#### Rules

1. A bare `*` with no value creates an array object entry
2. Children of the bare `*` become properties of that object
3. Array objects and simple array values SHOULD NOT be mixed under the same parent

---

### 7. Multiline Values

Multiline values use the pipe `|` character:

```msn
- description: |
-- This is a long description
-- that spans multiple lines
-- and preserves line breaks.
```

```json
{
  "description": "This is a long description\nthat spans multiple lines\nand preserves line breaks."
}
```

#### Folded Multiline

Use `>` for folded text (joins lines with spaces):

```msn
- summary: >
-- This is a summary
-- that will be joined
-- into a single line.
```

```json
{
  "summary": "This is a summary that will be joined into a single line."
}
```

#### Rules

1. `|` preserves line breaks (literal block)
2. `>` folds lines into a single line (folded block)
3. Continuation lines MUST be at depth N+1 relative to the key
4. Continuation lines are treated as text, not as key-value pairs

---

### 8. Comments

Comments use the `#` character:

```msn
# This is a full-line comment
- name: My App    # This is an inline comment
- version: 1.0.0
# Another comment
```

#### Rules

1. Lines starting with `#` (after optional whitespace) are full-line comments
2. `#` after a value starts an inline comment
3. Comments are stripped during parsing and do not appear in output
4. `#` inside quoted strings is NOT treated as a comment

---

### 9. Type Inference

MSN automatically infers types from values:

| MSN Value | JSON Type | Example                               |
| --------- | --------- | ------------------------------------- |
| `42`      | number    | `- count: 42` → `{"count": 42}`       |
| `3.14`    | number    | `- pi: 3.14` → `{"pi": 3.14}`         |
| `true`    | boolean   | `- active: true` → `{"active": true}` |
| `false`   | boolean   | `- debug: false` → `{"debug": false}` |
| `null`    | null      | `- data: null` → `{"data": null}`     |
| `hello`   | string    | `- name: hello` → `{"name": "hello"}` |
| `"42"`    | string    | `- code: "42"` → `{"code": "42"}`     |

#### Rules

1. Unquoted integers and floats → `number`
2. `true` and `false` (case-insensitive) → `boolean`
3. `null` (case-insensitive) → `null`
4. Everything else → `string`
5. Values wrapped in double quotes are always treated as `string`
6. Leading/trailing whitespace in values is trimmed

---

### 10. JSON Mapping

MSN maps to JSON with the following correspondence:

| MSN Construct           | JSON Equivalent             |
| ----------------------- | --------------------------- |
| `- key: value`          | `{ "key": value }`          |
| `- key` (with children) | `{ "key": { ... } }`        |
| `-- * value`            | `[ value, ... ]`            |
| `-- *` (with children)  | `[ { ... }, ... ]`          |
| `- key: \|` (multiline) | `{ "key": "line1\nline2" }` |
| `- key: >` (folded)     | `{ "key": "line1 line2" }`  |

#### Complete Example

```msn
# Application configuration
- app
-- name: My Application
-- version: 2.1.0
-- debug: false
-- server
--- host: 0.0.0.0
--- port: 3000
--- cors
---- enabled: true
---- origins
----- * https://example.com
----- * https://api.example.com
-- database
--- primary
---- driver: postgres
---- host: db.example.com
---- port: 5432
---- credentials
----- username: app_user
----- password: secure_pass
--- replicas
---- *
----- host: replica1.example.com
----- port: 5432
---- *
----- host: replica2.example.com
----- port: 5432
-- features
--- * authentication
--- * authorization
--- * rate-limiting
--- * logging
-- metadata
--- description: |
---- This is the main application
---- configuration file for production
---- deployment.
--- tags
---- * production
---- * v2
---- * stable
```

```json
{
  "app": {
    "name": "My Application",
    "version": "2.1.0",
    "debug": false,
    "server": {
      "host": "0.0.0.0",
      "port": 3000,
      "cors": {
        "enabled": true,
        "origins": ["https://example.com", "https://api.example.com"]
      }
    },
    "database": {
      "primary": {
        "driver": "postgres",
        "host": "db.example.com",
        "port": 5432,
        "credentials": {
          "username": "app_user",
          "password": "secure_pass"
        }
      },
      "replicas": [
        {
          "host": "replica1.example.com",
          "port": 5432
        },
        {
          "host": "replica2.example.com",
          "port": 5432
        }
      ]
    },
    "features": ["authentication", "authorization", "rate-limiting", "logging"],
    "metadata": {
      "description": "This is the main application\nconfiguration file for production\ndeployment.",
      "tags": ["production", "v2", "stable"]
    }
  }
}
```

---

### 11. File Extension

MSN files use the `.msn` extension.

### 12. MIME Type

`application/x-msn`

### 13. Encoding

MSN files MUST be encoded in UTF-8.

---

### 14. Grammar (EBNF)

```ebnf
document    = { line } ;
line        = comment | entry | blank ;
comment     = { whitespace } , "#" , { any_char } ;
entry       = dashes , " " , ( array_item | key_value | container ) , [ inline_comment ] ;
dashes      = "-" , { "-" } ;
array_item  = "* " , ( value | "" ) ;
key_value   = key , ": " , value ;
container   = key ;
key         = identifier ;
value       = string | number | boolean | null_val | multiline_marker ;
string      = quoted_string | unquoted_string ;
number      = integer | float ;
boolean     = "true" | "false" ;
null_val    = "null" ;
multiline_marker = "|" | ">" ;
inline_comment   = " #" , { any_char } ;
```

---

### 15. Error Handling

Parsers MUST report errors for:

1. Lines not starting with `-` or `#` (excluding blank lines)
2. Depth increase greater than 1 between consecutive non-comment lines
3. Missing space after dash prefix
4. Missing space after `:`
5. Mixed array items and key-value pairs at the same depth under the same parent
6. Invalid multiline continuation (wrong depth)

---

### 16. Versioning

This specification follows Semantic Versioning. The current version is **1.0.0**.
