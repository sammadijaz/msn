import * as vscode from "vscode";

// Inline parser implementations so the extension can work standalone without @madsn/parser dependency
// In production, these would come from @madsn/parser and @madsn/validator

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection("msn");
  context.subscriptions.push(diagnosticCollection);

  // Validate on open and save
  const config = vscode.workspace.getConfiguration("msn");

  if (config.get("validate.enable", true)) {
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === "msn") validateDocument(doc, diagnosticCollection);
      }),
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === "msn") validateDocument(doc, diagnosticCollection);
      }),
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId === "msn") validateDocument(e.document, diagnosticCollection);
      }),
    );
  }

  // Format provider
  if (config.get("format.enable", true)) {
    context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider("msn", {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
          const formatted = formatMsn(document.getText());
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length),
          );
          return [vscode.TextEdit.replace(fullRange, formatted)];
        },
      }),
    );
  }

  // Compile command
  context.subscriptions.push(
    vscode.commands.registerCommand("msn.compile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "msn") {
        vscode.window.showWarningMessage("Open an MSN file first");
        return;
      }
      try {
        const json = compileMsn(editor.document.getText());
        const doc = await vscode.workspace.openTextDocument({
          content: JSON.stringify(json, null, 2),
          language: "json",
        });
        await vscode.window.showTextDocument(doc, {
          viewColumn: vscode.ViewColumn.Beside,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`MSN Compile Error: ${msg}`);
      }
    }),
  );

  // Validate command
  context.subscriptions.push(
    vscode.commands.registerCommand("msn.validate", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "msn") {
        vscode.window.showWarningMessage("Open an MSN file first");
        return;
      }
      validateDocument(editor.document, diagnosticCollection);
      const count = diagnosticCollection.get(editor.document.uri)?.length ?? 0;
      if (count === 0) {
        vscode.window.showInformationMessage("✓ Valid MSN");
      } else {
        vscode.window.showWarningMessage(`${count} issue(s) found`);
      }
    }),
  );

  // Format command
  context.subscriptions.push(
    vscode.commands.registerCommand("msn.format", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "msn") {
        vscode.window.showWarningMessage("Open an MSN file first");
        return;
      }
      const formatted = formatMsn(editor.document.getText());
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length),
      );
      await editor.edit((editBuilder) => {
        editBuilder.replace(fullRange, formatted);
      });
    }),
  );

  // Hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider("msn", {
      provideHover(document, position) {
        const line = document.lineAt(position.line).text;
        const trimmed = line.trim();

        if (trimmed.startsWith("#")) {
          return new vscode.Hover("**MSN Comment** — Ignored during compilation");
        }

        const dashMatch = trimmed.match(/^(-+)\s/);
        if (dashMatch) {
          const depth = dashMatch[1].length;
          const content = trimmed.slice(dashMatch[0].length);

          if (content.startsWith("* ")) {
            return new vscode.Hover(
              `**Array Item** at depth ${depth}\n\nCompiles to a JSON array element`,
            );
          }
          if (content === "*") {
            return new vscode.Hover(
              `**Array Object** at depth ${depth}\n\nCreates an object inside an array`,
            );
          }
          if (content.includes(": ")) {
            const key = content.split(": ")[0];
            return new vscode.Hover(`**Key-Value** \`${key}\` at depth ${depth}`);
          }
          return new vscode.Hover(
            `**Container** \`${content}\` at depth ${depth}\n\nCreates a nested JSON object`,
          );
        }

        return undefined;
      },
    }),
  );

  // Validate open documents
  vscode.workspace.textDocuments.forEach((doc) => {
    if (doc.languageId === "msn") validateDocument(doc, diagnosticCollection);
  });
}

export function deactivate() {}

// ---- Embedded mini-implementations ----

function validateDocument(
  document: vscode.TextDocument,
  diagnostics: vscode.DiagnosticCollection,
): void {
  const errors: vscode.Diagnostic[] = [];
  const lines = document.getText().split(/\r?\n/);
  let prevDepth = 0;
  let hasPrev = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const dashMatch = raw.match(/^(-+)(.*)/);
    if (!dashMatch) {
      errors.push(
        new vscode.Diagnostic(
          new vscode.Range(i, 0, i, raw.length),
          "Line must start with dashes (-)",
          vscode.DiagnosticSeverity.Error,
        ),
      );
      continue;
    }

    const depth = dashMatch[1].length;
    const after = dashMatch[2];

    if (after.length > 0 && after[0] !== " ") {
      errors.push(
        new vscode.Diagnostic(
          new vscode.Range(i, depth, i, depth + 1),
          "Missing space after dash prefix",
          vscode.DiagnosticSeverity.Error,
        ),
      );
    }

    if (hasPrev && depth > prevDepth + 1) {
      errors.push(
        new vscode.Diagnostic(
          new vscode.Range(i, 0, i, depth),
          `Depth increased by ${depth - prevDepth} (max is 1)`,
          vscode.DiagnosticSeverity.Error,
        ),
      );
    }

    prevDepth = depth;
    hasPrev = true;
  }

  diagnostics.set(document.uri, errors);
}

function formatMsn(source: string): string {
  const lines = source.split(/\r?\n/);
  const formatted: string[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed === "") {
      formatted.push("");
      continue;
    }
    if (trimmed.startsWith("#")) {
      formatted.push(trimmed);
      continue;
    }

    const dashMatch = trimmed.match(/^(-+)\s*(.*)/);
    if (!dashMatch) {
      formatted.push(trimmed);
      continue;
    }

    const dashes = dashMatch[1];
    const content = dashMatch[2].trim();
    formatted.push(`${dashes} ${content}`);
  }

  return formatted.join("\n") + "\n";
}

type JsonVal = string | number | boolean | null | JsonVal[] | { [k: string]: JsonVal };

function compileMsn(source: string): JsonVal {
  const lines = source.split(/\r?\n/);

  interface StackEntry {
    obj: Record<string, JsonVal>;
    depth: number;
    key?: string;
    isArray?: boolean;
    arr?: JsonVal[];
  }
  const root: Record<string, JsonVal> = {};
  const stack: StackEntry[] = [{ obj: root, depth: 0 }];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const dashMatch = trimmed.match(/^(-+)\s+(.*)/);
    if (!dashMatch) continue;

    const depth = dashMatch[1].length;
    let content = dashMatch[2];

    // Strip inline comment
    const commentIdx = content.indexOf(" #");
    if (commentIdx !== -1) content = content.slice(0, commentIdx).trim();

    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    const parent = stack[stack.length - 1];

    if (content === "*") {
      const entry: Record<string, JsonVal> = {};
      if (parent.isArray && parent.arr) {
        parent.arr.push(entry);
      } else if (parent.key) {
        const arr = (parent.obj[parent.key] as JsonVal[] | undefined) ?? [];
        if (!Array.isArray(parent.obj[parent.key])) parent.obj[parent.key] = arr;
        (arr as JsonVal[]).push(entry);
      }
      stack.push({ obj: entry, depth, isArray: false });
    } else if (content.startsWith("* ")) {
      const val = inferTypeVal(content.slice(2).trim());
      if (parent.isArray && parent.arr) {
        parent.arr.push(val);
      } else if (parent.key) {
        if (!Array.isArray(parent.obj[parent.key])) parent.obj[parent.key] = [];
        (parent.obj[parent.key] as JsonVal[]).push(val);
      }
    } else if (content.includes(": ")) {
      const ci = content.indexOf(": ");
      const key = content.slice(0, ci);
      const value = content.slice(ci + 2);
      parent.obj[key] = inferTypeVal(value);
    } else {
      parent.obj[content] = {};
      stack.push({
        obj: parent.obj[content] as Record<string, JsonVal>,
        depth,
        key: content,
      });
    }
  }

  return root;
}

function inferTypeVal(v: string): JsonVal {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
    return v.slice(1, -1);
  const lower = v.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  if (lower === "null") return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}
