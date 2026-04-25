import { World, setWorldConstructor } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber";
import { InMemoryOrgModelDriver, OrgModelError } from "./org-model-driver.js";
import type { IngestPayload } from "./org-model-driver.js";
import type { RecommendationArtifact, RecommendationRequest } from "./org-model-driver.js";
import { InMemoryOrgModelRepository } from "../../src/org-model/in-memory-repository.js";
import { InteractiveOrgCliSession, type InteractiveIo } from "../../src/org-model/interactive-session.js";

export class OrgModelWorld extends World {
  readonly driver = new InMemoryOrgModelDriver();
  readonly interactiveRepository = new InMemoryOrgModelRepository();
  lastError?: OrgModelError;
  lastIngestResult?: { scopeId: string; unitCount: number };
  lastIngestPayload?: IngestPayload;
  lastRecommendationRequest?: RecommendationRequest;
  lastRecommendationArtifact?: RecommendationArtifact;
  previousRecommendationArtifact?: RecommendationArtifact;
  interactiveMessages: string[] = [];
  interactiveSession?: InteractiveOrgCliSession;
  interactiveIo?: InteractiveIo;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(OrgModelWorld);
