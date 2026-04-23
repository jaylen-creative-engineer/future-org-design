#!/usr/bin/env zx

import { chalk, quote, spinner, $ } from "zx";

/**
 * Parse a minimal argument surface for flow test execution.
 * Supported:
 *   --tags <expr> / -t <expr>
 *   --dry-run
 *   --help / -h
 */
function parseCliArgs(rawArgs) {
  const parsed = {
    tags: undefined,
    dryRun: false,
    help: false
  };

  for (let i = 0; i < rawArgs.length; i += 1) {
    const token = rawArgs[i];
    if (token === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (token === "--help" || token === "-h") {
      parsed.help = true;
      continue;
    }
    if (token === "--tags" || token === "-t") {
      const next = rawArgs[i + 1];
      if (!next || next.startsWith("-")) {
        throw new Error("Missing value for --tags");
      }
      parsed.tags = next;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

const showHelp = () => {
  console.log(`Run executable functional flows for this project.

Usage:
  npm run flows:test -- [options]

Options:
  -t, --tags <expression>  Run only matching Cucumber scenarios
      --dry-run            Print the generated command without executing
  -h, --help               Show this help text

Examples:
  npm run flows:test
  npm run flows:test -- --tags "@org-model-intelligence"
  npm run flows:test -- --tags "@REC-01 or @REC-02"
  npm run flows:test -- --dry-run --tags "@S-ORG-01"
`);
};

function getUserArgs() {
  const args = process.argv.slice(2);
  if (args[0]?.endsWith(".mjs")) {
    return args.slice(1);
  }
  return args;
}

const args = parseCliArgs(getUserArgs());

if (args.help) {
  showHelp();
  process.exit(0);
}

const command = ["npm", "run", "bdd"];
if (args.tags) {
  command.push("--", "--tags", args.tags);
}

const commandLabel = command.map((part) => quote(part)).join(" ");

if (args.dryRun) {
  console.log(commandLabel);
  process.exit(0);
}

const runSpinner = spinner();
runSpinner.start("Running functional flows via Cucumber...");

try {
  if (args.tags) {
    await $`npm run bdd -- --tags ${args.tags}`;
  } else {
    await $`npm run bdd`;
  }
  runSpinner.succeed(chalk.green("Functional flows completed successfully."));
} catch (error) {
  runSpinner.fail(chalk.red("Functional flows failed."));
  throw error;
}
