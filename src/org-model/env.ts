import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DB_POOL_MAX: z.coerce.number().int().positive().default(3),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  DB_CONN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000)
});

export type OrgCliEnv = z.infer<typeof envSchema>;

export function loadOrgCliEnv(source: NodeJS.ProcessEnv = process.env): OrgCliEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment for org-model CLI: ${details}`);
  }
  return parsed.data;
}
