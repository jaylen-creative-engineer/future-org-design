import { loadCliEnv, parseFlags } from "./shared.js";

async function main(): Promise<void> {
  loadCliEnv();
  const flags = parseFlags(process.argv.slice(2));

  if (flags.help) {
    const { runHelp } = await import("./batch.js");
    runHelp();
    return;
  }

  if (flags.smoke) {
    const { runSmoke } = await import("./batch.js");
    process.exitCode = await runSmoke(flags.mode);
    return;
  }

  if (flags.demo) {
    const { runGuidedDemoBatch } = await import("./batch.js");
    process.exitCode = await runGuidedDemoBatch(flags.mode);
    return;
  }

  if (!process.stdin.isTTY) {
    const { printHelp } = await import("./shared.js");
    console.error("Interactive mode requires a TTY terminal. Use --smoke or --demo for non-interactive execution.");
    printHelp();
    process.exitCode = 1;
    return;
  }

  const { startInteractive } = await import("./interactive.js");
  await startInteractive(flags.mode);
}

main().catch((error: unknown) => {
  console.error(`org-model CLI failed: ${(error as Error).message}`);
  process.exitCode = 1;
});
