import { Before } from "@cucumber/cucumber";
import { OrgModelWorld } from "./world.js";

Before(function (this: OrgModelWorld) {
  this.lastError = undefined;
  this.lastIngestResult = undefined;
  this.lastIngestPayload = undefined;
  this.lastRecommendationRequest = undefined;
  this.lastRecommendationArtifact = undefined;
  this.previousRecommendationArtifact = undefined;
});
