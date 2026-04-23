#!/usr/bin/env zx

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { chalk, spinner, $ } from "zx";

/**
 * Parse a minimal argument surface for flow test execution.
 * Supported:
 *   --tags <expr> / -t <expr>
 *   --dry-run
 *   --conversational / -c
 *   --help / -h
 */
function parseCliArgs(rawArgs) {
  const parsed = {
    tags: undefined,
    dryRun: false,
    conversational: false,
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
    if (token === "--conversational" || token === "-c") {
      parsed.conversational = true;
      continue;
    }
    if (token === "--tags" || token === "-t") {
      const next = rawArgs[i + 1];
      if (!next || next.startsWith("-")) {
        throw new Error("Missing value for --tags");
      }
      const normalizedTags = normalizeTagsExpression(next);
      if (!normalizedTags) {
        throw new Error("Tag expression for --tags cannot be empty");
      }
      parsed.tags = normalizedTags;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

const showHelp = () => {
  console.log(`Functional Flows Navigator

Purpose:
  Run or preview executable functional flows backed by Cucumber.
  You can use direct flags or a conversational guided mode.

Usage:
  npm run flows:test -- [options]

Options:
  -t, --tags <expression>  Run only matching Cucumber scenario tags
      --dry-run            Preview the execution plan without running tests
  -c, --conversational     Guide the run via interactive prompts
  -h, --help               Show this help text

Examples:
  npm run flows:test
  npm run flows:test -- --tags "@org-model-intelligence"
  npm run flows:test -- --tags "@REC-01 or @REC-02"
  npm run flows:test -- --dry-run --tags "@S-ORG-01"
  npm run flows:test -- --conversational
`);
};

function formatCommand(commandParts) {
  return commandParts.map((part) => (part.includes(" ") ? `"${part}"` : part)).join(" ");
}

function normalizeTagsExpression(expression) {
  return expression.replace(/\s+/g, " ").trim();
}

function printExecutionPlan({ dryRun, tags, commandLabel, conversational }) {
  console.log("Functional Flows Navigator");
  console.log("==========================");
  console.log(`Conversation mode: ${conversational ? "enabled" : "disabled"}`);
  console.log(`Mode: ${dryRun ? "Preview only (dry-run)" : "Execute scenarios"}`);
  console.log(`Scenario filter: ${tags ?? "All scenarios in features/**/*.feature"}`);
  console.log(`Execution command: ${commandLabel}`);
  if (dryRun) {
    console.log("Next step: remove --dry-run to execute this command.");
  }
}

function isInteractiveTerminal() {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

async function readScriptedAnswersFromStdin() {
  let raw = "";
  for await (const chunk of stdin) {
    raw += chunk.toString();
  }
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function askChoice(rl, promptLabel, validChoices) {
  while (true) {
    const answer = (await rl.question(promptLabel)).trim();
    if (validChoices.includes(answer)) {
      return answer;
    }
    console.log(`Please choose one of: ${validChoices.join(", ")}`);
  }
}

async function askNonEmpty(rl, promptLabel) {
  while (true) {
    const answer = normalizeTagsExpression(await rl.question(promptLabel));
    if (answer.length > 0) {
      return answer;
    }
    console.log("Tag expression cannot be empty. Please try again.");
  }
}

async function collectConversationalRequest() {
  console.log("Conversation mode: enabled");
  console.log("Step 1 - Choose how to run:");
  console.log("  [1] Preview execution plan only (safe)");
  console.log("  [2] Execute scenarios now");

  if (isInteractiveTerminal()) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const modeChoice = await askChoice(rl, "Enter choice (1 or 2): ", ["1", "2"]);
      const dryRun = modeChoice === "1";

      console.log("Step 2 - Choose scenario scope:");
      console.log("  [1] Run all scenarios");
      console.log("  [2] Filter by tags");
      const scopeChoice = await askChoice(rl, "Enter choice (1 or 2): ", ["1", "2"]);
      const tags =
        scopeChoice === "2"
          ? await askNonEmpty(rl, "Tell me the tag expression to run (example: @ORG-01 or @REC-01): ")
          : undefined;

      if (!dryRun) {
        console.log("Step 3 - Confirm execution:");
        console.log("  [y] Yes, run now");
        console.log("  [n] No, cancel");
        const confirmChoice = await askChoice(rl, "Enter choice (y or n): ", ["y", "n"]);
        if (confirmChoice === "n") {
          return { cancelled: true, dryRun: false, tags };
        }
      }

      return { cancelled: false, dryRun, tags };
    } finally {
      rl.close();
    }
  }

  const scriptedAnswers = await readScriptedAnswersFromStdin();
  let answerIndex = 0;
  const nextAnswer = (promptLabel) => {
    const answer = scriptedAnswers[answerIndex];
    answerIndex += 1;
    if (!answer) {
      throw new Error(`Missing conversational response for prompt "${promptLabel}"`);
    }
    console.log(`${promptLabel}${answer}`);
    return answer;
  };

  const modeChoice = nextAnswer("Enter choice (1 or 2): ");
  if (!["1", "2"].includes(modeChoice)) {
    throw new Error(`Invalid mode choice "${modeChoice}". Expected 1 or 2.`);
  }
  const dryRun = modeChoice === "1";

  console.log("Step 2 - Choose scenario scope:");
  console.log("  [1] Run all scenarios");
  console.log("  [2] Filter by tags");
  const scopeChoice = nextAnswer("Enter choice (1 or 2): ");
  if (!["1", "2"].includes(scopeChoice)) {
    throw new Error(`Invalid scenario scope choice "${scopeChoice}". Expected 1 or 2.`);
  }

  let tags;
  if (scopeChoice === "2") {
    const promptLabel = "Tell me the tag expression to run (example: @ORG-01 or @REC-01): ";
    const rawTagAnswer = nextAnswer(promptLabel);
    const normalizedTags = normalizeTagsExpression(rawTagAnswer);
    if (!normalizedTags) {
      throw new Error("Tag expression cannot be empty.");
    }
    tags = normalizedTags;
  }

  if (!dryRun) {
    console.log("Step 3 - Confirm execution:");
    console.log("  [y] Yes, run now");
    console.log("  [n] No, cancel");
    const confirmChoice = nextAnswer("Enter choice (y or n): ");
    if (!["y", "n"].includes(confirmChoice)) {
      throw new Error(`Invalid confirmation choice "${confirmChoice}". Expected y or n.`);
    }
    if (confirmChoice === "n") {
      return { cancelled: true, dryRun: false, tags };
    }
  }

  return { cancelled: false, dryRun, tags };
}

function getUserArgs() {
  const args = process.argv.slice(2);
  if (args[0]?.endsWith(".mjs")) {
    return args.slice(1);
  }
  return args;
}

let args;
try {
  args = parseCliArgs(getUserArgs());
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Input error: ${message}`);
  console.error("Run `npm run flows:test -- --help` for usage.");
  process.exit(1);
}

if (args.help) {
  showHelp();
  process.exit(0);
}

const conversational = args.conversational || (!args.tags && !args.dryRun && isInteractiveTerminal());
let dryRun = args.dryRun;
let tags = args.tags;

if (conversational) {
  let response;
  try {
    response = await collectConversationalRequest();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Input error: ${message}`);
    console.error(
      "Conversation mode needs either an interactive terminal or enough piped responses for each prompt."
    );
    process.exit(1);
  }
  if (response.cancelled) {
    console.log("Execution cancelled by user. No scenarios were run.");
    process.exit(0);
  }
  dryRun = response.dryRun;
  tags = response.tags;
}

const command = ["npm", "run", "bdd"];
if (tags) {
  command.push("--", "--tags", tags);
}
const commandLabel = formatCommand(command);

if (dryRun) {
  printExecutionPlan({ dryRun: true, tags, commandLabel, conversational });
  process.exit(0);
}

printExecutionPlan({ dryRun: false, tags, commandLabel, conversational });

try {
  if (tags) {
    await spinner("Running functional flows via Cucumber...", async () => $`npm run bdd -- --tags ${tags}`);
  } else {
    await spinner("Running functional flows via Cucumber...", async () => $`npm run bdd`);
  }
  console.log(chalk.green("Result: Functional flows completed successfully."));
} catch (error) {
  console.error(chalk.red("Result: Functional flows failed."));
  throw error;
}
