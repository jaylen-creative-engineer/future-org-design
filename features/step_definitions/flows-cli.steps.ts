import { Given, Then, When } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { once } from "node:events";
import { OrgModelWorld } from "../support/world.js";

const workspaceRoot = resolve(process.cwd());

interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runProcess(command: string, args: string[]): Promise<ProcessResult> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      resolveResult({
        exitCode: code ?? 1,
        stdout,
        stderr
      });
    });
  });
}

async function runProcessWithInput(command: string, args: string[], inputLines: string[]): Promise<ProcessResult> {
  const child = spawn(command, args, {
    cwd: workspaceRoot,
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk: Buffer | string) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer | string) => {
    stderr += chunk.toString();
  });

  for (const line of inputLines) {
    child.stdin.write(`${line}\n`);
  }
  child.stdin.end();

  const [code] = (await once(child, "close")) as [number | null];
  return {
    exitCode: code ?? 1,
    stdout,
    stderr
  };
}

Given(
  "the functional flows CLI command is prepared with tags expression {string}",
  function (this: OrgModelWorld, tagsExpression: string) {
    this.flowsCliArgs = ["run", "flows:test", "--", "--dry-run", "--tags", tagsExpression];
  }
);

When("the functional flows CLI command is executed", async function (this: OrgModelWorld) {
  const args = this.flowsCliArgs ?? ["run", "flows:test", "--", "--dry-run"];
  this.lastFlowsCliResult = await runProcess("npm", args);
});

Given(
  "the conversational functional flows CLI command is prepared",
  function (this: OrgModelWorld) {
    this.flowsCliArgs = ["run", "flows:test", "--", "--conversational"];
    this.flowsCliConversationInput = undefined;
  }
);

Given(
  "the conversational functional flows CLI responses are:",
  function (this: OrgModelWorld, docString: string) {
    this.flowsCliConversationInput = docString
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
);

When("the conversational functional flows CLI command is executed", async function (this: OrgModelWorld) {
  const args = this.flowsCliArgs ?? ["run", "flows:test", "--", "--conversational"];
  const input = this.flowsCliConversationInput ?? [];
  this.lastFlowsCliResult = await runProcessWithInput("npm", args, input);
});

Then("the functional flows CLI command exits successfully", function (this: OrgModelWorld) {
  assert.ok(this.lastFlowsCliResult, "Expected CLI process result");
  assert.equal(this.lastFlowsCliResult.exitCode, 0, this.lastFlowsCliResult.stderr);
});

Then(
  "the functional flows CLI output includes label {string}",
  function (this: OrgModelWorld, label: string) {
    assert.ok(this.lastFlowsCliResult, "Expected CLI process result");
    assert.ok(
      this.lastFlowsCliResult.stdout.includes(label),
      `Expected stdout to include label "${label}"\nActual stdout:\n${this.lastFlowsCliResult.stdout}\nStderr:\n${this.lastFlowsCliResult.stderr}`
    );
  }
);
