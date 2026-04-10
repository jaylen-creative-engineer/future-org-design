import fs from "node:fs/promises";
import path from "node:path";

import { buildKnowledgeGraph } from "./build-graph.js";
import type { KnowledgeGraph } from "./types.js";
import type { PageDocument } from "./build-graph.js";

const MARKDOWN_EXT = ".md";

/**
 * Load every `*.md` file directly under `graphRootDir` and build a {@link KnowledgeGraph}.
 */
export async function loadKnowledgeGraphFromDirectory(graphRootDir: string): Promise<KnowledgeGraph> {
  const absRoot = path.resolve(graphRootDir);
  const entries = await fs.readdir(absRoot, { withFileTypes: true });
  const pages: PageDocument[] = [];

  for (const ent of entries) {
    if (!ent.isFile()) continue;
    if (!ent.name.endsWith(MARKDOWN_EXT)) continue;
    const pageId = ent.name.slice(0, -MARKDOWN_EXT.length);
    const absFile = path.join(absRoot, ent.name);
    const markdown = await fs.readFile(absFile, "utf8");
    pages.push({
      pageId,
      relativePath: ent.name.split(path.sep).join("/"),
      markdown,
    });
  }

  pages.sort((a, b) => a.pageId.localeCompare(b.pageId));

  return buildKnowledgeGraph(absRoot, pages);
}
