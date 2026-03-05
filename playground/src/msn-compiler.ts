/**
 * Standalone MSN compiler for the playground.
 * Self-contained so it works without importing @msn/parser.
 */

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function inferType(value: string): string | number | boolean | null {
  if (value === "") return "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
    return value.slice(1, -1);
  const lower = value.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  if (lower === "null") return null;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  return value;
}

function stripInlineComment(content: string): string {
  let inQuote = false;
  let quoteChar = "";
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuote) {
      if (ch === quoteChar && content[i - 1] !== "\\") inQuote = false;
    } else {
      if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === "#" && i > 0 && content[i - 1] === " ")
        return content.slice(0, i).trimEnd();
    }
  }
  return content;
}

interface Token {
  type:
    | "kv"
    | "container"
    | "array-item"
    | "array-object"
    | "multiline"
    | "skip";
  depth: number;
  key?: string;
  value?: string;
  mode?: "|" | ">";
  raw: string;
}

function tokenize(source: string): Token[] {
  const lines = source.split(/\r?\n/);
  const tokens: Token[] = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      tokens.push({ type: "skip", depth: 0, raw });
      continue;
    }
    const dm = raw.match(/^(-+)\s/);
    if (!dm) throw new Error(`Invalid line: "${raw}"`);
    const depth = dm[1].length;
    const content = stripInlineComment(raw.slice(depth).trimStart());
    if (content === "*") {
      tokens.push({ type: "array-object", depth, raw });
      continue;
    }
    if (content.startsWith("* ")) {
      tokens.push({
        type: "array-item",
        depth,
        value: content.slice(2).trim(),
        raw,
      });
      continue;
    }
    const ci = content.indexOf(": ");
    if (ci !== -1) {
      const key = content.slice(0, ci).trim();
      const val = content.slice(ci + 2).trim();
      if (val === "|" || val === ">") {
        tokens.push({
          type: "multiline",
          depth,
          key,
          mode: val as "|" | ">",
          raw,
        });
        continue;
      }
      tokens.push({ type: "kv", depth, key, value: val, raw });
      continue;
    }
    tokens.push({ type: "container", depth, key: content.trim(), raw });
  }
  return tokens;
}

interface ASTNode {
  type: "root" | "object" | "array" | "value" | "array-item";
  key?: string;
  value?: JsonValue;
  children: ASTNode[];
  depth: number;
}

function buildAST(tokens: Token[]): ASTNode {
  const root: ASTNode = { type: "root", children: [], depth: 0 };
  const stack: { node: ASTNode; depth: number }[] = [{ node: root, depth: 0 }];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.type === "skip") {
      i++;
      continue;
    }
    while (stack.length > 1 && stack[stack.length - 1].depth >= t.depth)
      stack.pop();
    const parent = stack[stack.length - 1].node;
    if (t.type === "kv") {
      parent.children.push({
        type: "value",
        key: t.key,
        value: inferType(t.value!),
        children: [],
        depth: t.depth,
      });
      i++;
    } else if (t.type === "container") {
      const n: ASTNode = {
        type: "object",
        key: t.key,
        children: [],
        depth: t.depth,
      };
      parent.children.push(n);
      stack.push({ node: n, depth: t.depth });
      i++;
    } else if (t.type === "array-item") {
      if (parent.type !== "root") parent.type = "array";
      parent.children.push({
        type: "array-item",
        value: inferType(t.value!),
        children: [],
        depth: t.depth,
      });
      i++;
    } else if (t.type === "array-object") {
      if (parent.type !== "root") parent.type = "array";
      const n: ASTNode = { type: "object", children: [], depth: t.depth };
      parent.children.push(n);
      stack.push({ node: n, depth: t.depth });
      i++;
    } else if (t.type === "multiline") {
      const mode = t.mode!;
      const mlDepth = t.depth + 1;
      const lines: string[] = [];
      i++;
      while (i < tokens.length) {
        const nt = tokens[i];
        if (nt.type === "skip") {
          i++;
          continue;
        }
        if (nt.depth !== mlDepth) break;
        const text = nt.raw.slice(nt.depth).trimStart();
        lines.push(nt.key || text);
        i++;
      }
      const val = mode === "|" ? lines.join("\n") : lines.join(" ");
      parent.children.push({
        type: "value",
        key: t.key,
        value: val,
        children: [],
        depth: t.depth,
      });
    } else {
      i++;
    }
  }
  return root;
}

function astToJson(node: ASTNode): JsonValue {
  if (
    node.type === "root" ||
    (node.type === "object" &&
      node.children.length > 0 &&
      !node.children.some(
        (c) => c.type === "array-item" || (c.type === "object" && !c.key),
      ))
  ) {
    const obj: Record<string, JsonValue> = {};
    for (const c of node.children) {
      if (!c.key) continue;
      if (c.type === "value") obj[c.key] = c.value as JsonValue;
      else obj[c.key] = astToJson(c);
    }
    return obj;
  }
  if (
    node.type === "array" ||
    (node.type === "object" &&
      node.children.some(
        (c) => c.type === "array-item" || (c.type === "object" && !c.key),
      ))
  ) {
    const arr: JsonValue[] = [];
    for (const c of node.children) {
      if (c.type === "array-item")
        arr.push(
          c.children.length > 0
            ? astToJson({ ...c, type: "object" })
            : (c.value as JsonValue),
        );
      else if (c.type === "object" && !c.key) arr.push(astToJson(c));
      else arr.push(astToJson(c));
    }
    return arr;
  }
  if (node.type === "value") return node.value as JsonValue;
  if (node.type === "object") {
    const obj: Record<string, JsonValue> = {};
    for (const c of node.children) {
      if (c.key)
        obj[c.key] = c.type === "value" ? (c.value as JsonValue) : astToJson(c);
    }
    return obj;
  }
  return null;
}

export function compileMSN(source: string): JsonValue {
  const tokens = tokenize(source);
  const ast = buildAST(tokens);
  return astToJson(ast);
}

export function compileMSNToString(source: string, indent = 2): string {
  return JSON.stringify(compileMSN(source), null, indent);
}
