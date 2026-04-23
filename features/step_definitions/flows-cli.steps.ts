import { Given, Then, When } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
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

Then("the functional flows CLI command exits successfully", function (this: OrgModelWorld) {
  assert.ok(this.lastFlowsCliResult, "Expected CLI process result");
  assert.equal(this.lastFlowsCliResult.exitCode, 0, this.lastFlowsCliResult.stderr);
});

Then(
  "the functional flows CLI dry-run command includes tags expression {string}",
  function (this: OrgModelWorld, tagsExpression: string) {
    assert.ok(this.lastFlowsCliResult, "Expected CLI process result");
    const expectedExpression = new RegExp(String.raw`npm run bdd -- --tags .*${tagsExpression.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    assert.match(
      this.lastFlowsCliResult.stdout,
      expectedExpression,
      `Expected stdout to include a command with tags expression ${tagsExpression}\nActual stdout:\n${this.lastFlowsCliResult.stdout}\nStderr:\n${this.lastFlowsCliResult.stderr}`
    );
  }
);
