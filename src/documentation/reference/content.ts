/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Toolkit, ToolkitTopic, ToolkitTopicEntry } from "./model";

// One dynamic import per language so webpack code-splits each language's
// snapshot (~370 KB each) into its own chunk.
const snapshots: Record<string, () => Promise<any>> = {
  en: () => import("../cms-snapshot/reference.en.json").then((m) => m.default),
  de: () => import("../cms-snapshot/reference.de.json").then((m) => m.default),
  nl: () => import("../cms-snapshot/reference.nl.json").then((m) => m.default),
  fr: () => import("../cms-snapshot/reference.fr.json").then((m) => m.default),
  es: () => import("../cms-snapshot/reference.es.json").then((m) => m.default),
};

const tryGet = async (langId: string): Promise<Toolkit | undefined> => {
  const loader = snapshots[langId];
  if (!loader) return undefined;
  return adaptContent(await loader());
};

export const fetchReferenceToolkit = async (
  languageId: string
): Promise<Toolkit> => {
  const preferred = await tryGet(languageId);
  if (preferred) return preferred;
  const fallback = await tryGet("en");
  if (!fallback) {
    throw new Error("English reference snapshot must exist");
  }
  return fallback;
};

export const getTopicAndEntry = (
  toolkit: Toolkit,
  topicOrEntryId: string | undefined
): [ToolkitTopic | undefined, ToolkitTopicEntry | undefined] => {
  const topic = toolkit.contents?.find(
    (t) => t.slug.current === topicOrEntryId
  );
  if (topic) {
    return [topic, undefined];
  }

  let entry: ToolkitTopicEntry | undefined = toolkit.contents?.flatMap((topic) => {
    return topic.contents ?? [];
  }).find((entry) => {
    return entry.slug.current === topicOrEntryId;
  });
  if (!entry) {
    return [undefined, undefined];
  }
  return [entry.parent, entry];
};

const adaptContent = (result: any): Toolkit | undefined => {
  const toolkits = result as Toolkit[];
  if (!toolkits || toolkits.length === 0) {
    return undefined;
  }
  if (toolkits.length > 1) {
    throw new Error("Unexpected results");
  }
  // Add topic entry parent for toolkit navigation.
  const toolkit = toolkits[0];
  toolkit.contents?.forEach((topic) => {
    topic.contents?.forEach((entry) => {
      entry.parent = topic;
    });
  });
  return toolkit;
};
