#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compile, compileToString, Parser } from "@msn/parser";
import { validate } from "@msn/validator";
import { format } from "@msn/formatter";

const HELP = `
MSN — Mad Sam Notation CLI

Usage:
  msn <command> [file] [options]

Commands:
  compile <file>    Compile MSN to JSON
  parse <file>      Parse MSN and output AST
  validate <file>   Validate MSN syntax
  format <file>     Format MSN file
  help              Show this help message
  version           Show version

Options:
  --indent <n>      JSON indent level (default: 2)
  --output <file>   Write output to file
  --stdin           Read from stdin

Examples:
  msn compile config.msn
  msn validate config.msn
  msn format config.msn
  cat config.msn | msn compile --stdin
`;

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function readInput(args: string[]): string {
  const fileArg = args.find((a) => !a.startsWith("--"));
  if (!fileArg) {
    console.error(
      "Error: No input file specified. Use --stdin for stdin input.",
    );
    process.exit(1);
  }
  const filePath = resolve(fileArg);
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    console.error(`Error: Cannot read file "${fileArg}"`);
    process.exit(1);
  }
}

function getOption(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
    console.log(HELP);
    process.exit(0);
  }

  if (args[0] === "version" || args[0] === "--version") {
    console.log("msn v1.0.0");
    process.exit(0);
  }

  const command = args[0];
  const rest = args.slice(1);
  const useStdin = rest.includes("--stdin");
  const indent = parseInt(getOption(rest, "--indent") ?? "2", 10);
  const outputFile = getOption(rest, "--output");

  let source: string;
  if (useStdin) {
    source = await readStdin();
  } else {
    source = readInput(rest);
  }

  let output: string;

  try {
    switch (command) {
      case "compile": {
        output = compileToString(source, indent);
        break;
      }

      case "parse": {
        const parser = new Parser();
        const ast = parser.parse(source);
        output = JSON.stringify(ast, null, indent);
        break;
      }

      case "validate": {
        const errors = validate(source);
        if (errors.length === 0) {
          console.log("✓ Valid MSN");
          process.exit(0);
        } else {
          for (const err of errors) {
            console.error(`  Line ${err.line}: ${err.message}`);
          }
          console.error(`\n✗ ${errors.length} error(s) found`);
          process.exit(1);
        }
        return;
      }

      case "format": {
        output = format(source);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  }

  if (outputFile) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(resolve(outputFile), output, "utf-8");
    console.log(`Output written to ${outputFile}`);
  } else {
    console.log(output);
  }
}

main();
