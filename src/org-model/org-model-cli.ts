import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { InMemoryOrgModelRepository } from "./in-memory-repository.js";
import { InteractiveOrgCliSession, type InteractiveIo } from "./interactive-session.js";
import { PostgresOrgModelRepository } from "./postgres-repository.js";
import type { OrgModelRepository } from "./repository.js";

class ReadlineIo implements InteractiveIo {
  constructor(private readonly rl: readline.Interface) {}

  async choose(label: string, options: readonly string[]): Promise<string> {
    if (options.length === 0) {
      throw new Error(`No options available for ${label}`);
    }

    output.write(`\n${label}\n`);
    options.forEach((option, index) => {
      output.write(`  ${index + 1}. ${option}\n`);
    });

    while (true) {
      const answer = (await this.rl.question("Select option number: ")).trim();
      const asNumber = Number(answer);
      if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= options.length) {
        return options[asNumber - 1] as string;
      }
      output.write(`Invalid selection "${answer}". Try again.\n`);
    }
  }

  async input(label: string): Promise<string> {
    return this.rl.question(`${label}: `);
  }

  output(message: string): void {
    output.write(`${message}\n`);
  }
}

function createRepository(mode: string): OrgModelRepository {
  if (mode === "memory") {
    return new InMemoryOrgModelRepository();
  }
  return new PostgresOrgModelRepository();
}

export async function runOrgModelCli(
  args: readonly string[],
  ioFactory: (rl: readline.Interface) => InteractiveIo = (rl) => new ReadlineIo(rl)
): Promise<void> {
  const modeArg = args.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg?.split("=")[1] ?? "postgres";
  if (mode !== "postgres" && mode !== "memory") {
    throw new Error(`Unsupported mode "${mode}". Use --mode=postgres or --mode=memory.`);
  }

  const repository = createRepository(mode);
  const rl = readline.createInterface({ input, output });
  const io = ioFactory(rl);

  try {
    io.output(`Repository mode: ${mode}`);
    if (mode === "postgres") {
      io.output("Postgres mode expects DATABASE_URL (Supabase connection string).");
    }
    const session = new InteractiveOrgCliSession(repository, io);
    await session.run();
  } finally {
    rl.close();
    await repository.close();
  }
}

async function main(): Promise<void> {
  await runOrgModelCli(process.argv.slice(2));
}

main().catch((error: unknown) => {
  output.write(`\norg-model-cli failed: ${(error as Error).message}\n`);
  process.exitCode = 1;
});
