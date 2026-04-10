import { describe, expect, it } from "vitest";

import { parseWikiLinks } from "./parse-wikilinks.js";

describe("parseWikiLinks", () => {
  it("parses page-only links", () => {
    expect(parseWikiLinks("See [[odaas-core]] for more.")).toEqual([
      { pageId: "odaas-core", headingAnchor: undefined },
    ]);
  });

  it("parses page and heading", () => {
    expect(parseWikiLinks("Loop: [[closed-loop-value-chain#Closed-loop pipeline]]")).toEqual([
      { pageId: "closed-loop-value-chain", headingAnchor: "Closed-loop pipeline" },
    ]);
  });

  it("trims inside brackets", () => {
    expect(parseWikiLinks("[[  competition  ]]")).toEqual([{ pageId: "competition", headingAnchor: undefined }]);
  });

  it("ignores empty page id", () => {
    expect(parseWikiLinks("[[#only-heading]]")).toEqual([]);
  });

  it("collects multiple links in order", () => {
    const md = "[[a]] then [[b#H]]";
    expect(parseWikiLinks(md)).toEqual([
      { pageId: "a", headingAnchor: undefined },
      { pageId: "b", headingAnchor: "H" },
    ]);
  });

  it("ignores wikilink-like text inside inline code", () => {
    expect(parseWikiLinks("see `[[fake]]` and [[real]]")).toEqual([{ pageId: "real", headingAnchor: undefined }]);
  });
});
