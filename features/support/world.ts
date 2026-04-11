import { World, setWorldConstructor } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber";
import { InMemoryOrgModelDriver, OrgModelError } from "./org-model-driver.js";
import type { IngestPayload } from "./org-model-driver.js";

export class OrgModelWorld extends World {
  readonly driver = new InMemoryOrgModelDriver();
  lastError?: OrgModelError;
  lastIngestResult?: { scopeId: string; unitCount: number };
  lastIngestPayload?: IngestPayload;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(OrgModelWorld);
