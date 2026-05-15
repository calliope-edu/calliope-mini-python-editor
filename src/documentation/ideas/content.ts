/**
 * (c) 2021-2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Idea } from "./model";

// One dynamic import per language so webpack code-splits each language's
// snapshot into its own chunk; only the requested locale is loaded.
const snapshots: Record<string, () => Promise<any>> = {
  en: () => import("../cms-snapshot/ideas.en.json").then((m) => m.default),
  de: () => import("../cms-snapshot/ideas.de.json").then((m) => m.default),
  nl: () => import("../cms-snapshot/ideas.nl.json").then((m) => m.default),
  fr: () => import("../cms-snapshot/ideas.fr.json").then((m) => m.default),
  es: () => import("../cms-snapshot/ideas.es.json").then((m) => m.default),
};

const tryGet = async (langId: string): Promise<Idea[] | undefined> => {
  const loader = snapshots[langId];
  if (!loader) return undefined;
  return adaptContent(await loader());
};

export const fetchIdeas = async (languageId: string): Promise<Idea[]> => {
  const preferred = await tryGet(languageId);
  if (preferred) return preferred;
  const fallback = await tryGet("en");
  if (!fallback) {
    throw new Error("English ideas snapshot must exist");
  }
  return fallback;
};

const adaptContent = (result: any): Idea[] | undefined => {
  const ideas = result?.pythonIdeasOrder as Idea[];
  if (!ideas || ideas.length === 0) {
    return undefined;
  }
  return ideas;
};
