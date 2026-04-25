import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { InMemoryOrgModelRepository } from "../../src/org-model/in-memory-repository.js";
import { PostgresOrgModelRepository } from "../../src/org-model/postgres-repository.js";
import type { OrgModelRepository } from "../../src/org-model/repository.js";

export type CliRuntimeMode = "memory" | "postgres";

export interface CliFlags {
  help: boolean;
  smoke: boolean;
  demo: boolean;
  mode: CliRuntimeMode;
}

export interface CliEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export function loadCliEnv(projectRoot: string = process.cwd()): void {
  const envPath = path.join(projectRoot, ".env");
  const envLocalPath = path.join(projectRoot, ".env.local");
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath, quiet: true });
  }
  if (existsSync(envLocalPath)) {
    loadDotenv({ path: envLocalPath, quiet: true, override: true });
  }
}

export function parseFlags(args: readonly string[]): CliFlags {
  const modeArg = args.find((arg) => arg.startsWith("--mode="));
  const modeValue = modeArg?.split("=")[1];
  if (modeValue && modeValue !== "memory" && modeValue !== "postgres") {
    throw new Error(`Unsupported mode "${modeValue}". Use --mode=memory or --mode=postgres.`);
  }

  return {
    help: args.includes("--help"),
    smoke: args.includes("--smoke"),
    demo: args.includes("--demo"),
    mode: (modeValue as CliRuntimeMode | undefined) ?? "postgres"
  };
}

export function printHelp(): void {
  process.stdout.write(
    [
      "Org model validation CLI",
      "",
      "Usage:",
      "  npm run org-model:cli -- [--mode=memory|postgres] [--help] [--smoke] [--demo]",
      "",
      "Flags:",
      "  --help   Show this help and exit.",
      "  --smoke  Run fast non-interactive smoke validation.",
      "  --demo   Run longer non-interactive guided demo flow.",
      "  --mode   Repository runtime mode (default: postgres).",
      "",
      "TTY behavior:",
      "  Running without --smoke/--demo requires an interactive TTY terminal.",
      "  In CI/IDE non-TTY runs, use --smoke or --demo to avoid prompt hangs.",
      "",
      "Loader note:",
      "  Use node ./node_modules/tsx/dist/cli.mjs ... and avoid NODE_OPTIONS=--import tsx",
      "  to prevent duplicate tsx registration issues.",
      ""
    ].join("\n")
  );
}

export function j(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createRepository(mode: CliRuntimeMode): OrgModelRepository {
  return mode === "memory" ? new InMemoryOrgModelRepository() : new PostgresOrgModelRepository();
}

export function toEnvelope<T>(work: () => Promise<T>): Promise<CliEnvelope<T>> {
  return work()
    .then((data) => ({ ok: true, data }))
    .catch((error: unknown) => ({
      ok: false,
      error: {
        code: "CLI_ERROR",
        message: (error as Error).message
      }
    }));
}
