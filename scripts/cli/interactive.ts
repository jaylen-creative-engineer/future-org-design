import { confirm, input, select, Separator } from "@inquirer/prompts";
import { $ } from "zx";
import { InteractiveOrgCliSession, type InteractiveIo } from "../../src/org-model/interactive-session.js";
import { createRepository, type CliRuntimeMode } from "./shared.js";
import { runGuidedDemoBatch } from "./batch.js";

$.verbose = false;

class InquirerIo implements InteractiveIo {
  async choose(label: string, options: readonly string[]): Promise<string> {
    return select({
      message: label,
      choices: options.map((option) => ({ name: option, value: option }))
    });
  }

  async input(label: string): Promise<string> {
    return input({ message: label });
  }

  output(message: string): void {
    process.stdout.write(`${message}\n`);
  }
}

async function runToolsMenu(): Promise<void> {
  const runTypecheck = await confirm({
    message: "Run `npm run typecheck` now?",
    default: false
  });
  if (!runTypecheck) {
    return;
  }
  await $`npm run typecheck`;
}

export async function startInteractive(mode: CliRuntimeMode): Promise<void> {
  let exit = false;

  while (!exit) {
    const action = await select({
      message: `Org model validation CLI (${mode})`,
      choices: [
        { name: "Start interactive session", value: "session" },
        { name: "Run guided demo batch (non-interactive path)", value: "demo" },
        new Separator(),
        { name: "Tools", value: "tools" },
        { name: "Exit", value: "exit" }
      ]
    });

    if (action === "exit") {
      exit = true;
      continue;
    }

    if (action === "tools") {
      await runToolsMenu();
      continue;
    }

    if (action === "demo") {
      await runGuidedDemoBatch(mode);
      continue;
    }

    if (action === "session") {
      const repository = createRepository(mode);
      try {
        const io = new InquirerIo();
        const session = new InteractiveOrgCliSession(repository, io);
        await session.run();
      } finally {
        await repository.close();
      }
    }
  }
}
