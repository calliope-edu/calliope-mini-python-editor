#!/usr/bin/env node
/**
 * One-shot extraction of all editor content out of Sanity into local
 * JSON snapshots committed under src/documentation/cms-snapshot/.
 *
 * Re-run when content changes upstream. The runtime no longer fetches
 * Sanity directly; see src/common/sanity.ts for the snapshot loader.
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ID = "hmru2910";
const DATASET = "production";
const API_BASE = `https://${PROJECT_ID}.apicdn.sanity.io/v1/data/query/${DATASET}`;

const LANGUAGES = ["en", "de", "nl", "fr", "es"];

const ideasQuery = (languageId) => `
    *[_type == "pythonIdeasConfig" && language == "${languageId}" && !(_id in path("drafts.**"))][0]{
      pythonIdeasOrder[]->{
        _id, name, language, compatibility, image, slug,
        content[] {
          ...,
          markDefs[]{
            ...,
            _type == "toolkitInternalLink" => {
                "slug": @.reference->slug,
                "targetType": @.reference->_type
            }
          }
        },
      }
    }`;

const toolkitQuery = (languageId) => `
  *[_type == "toolkit" && language == "${languageId}" && (slug.current == "explore" || slug.current == "reference") && !(_id in path("drafts.**"))]{
    id, name, description, language,
    contents[]->{
      name, slug, compatibility, subtitle, image,
      introduction[] {
        ...,
        markDefs[]{
          ...,
          _type == "toolkitInternalLink" => {
            "slug": @.reference->slug,
            "targetType": @.reference->_type
          }
        }
      },
      contents[]->{
        name, slug, compatibility,
        content[] {
          ...,
          markDefs[]{
            ...,
            _type == "toolkitInternalLink" => {
              "slug": @.reference->slug,
              "targetType": @.reference->_type
            }
          }
        },
        alternativesLabel, alternatives,
        detailContent[] {
          ...,
          markDefs[]{
            ...,
            _type == "toolkitInternalLink" => {
              "slug": @.reference->slug,
              "targetType": @.reference->_type
            }
          }
        },
      }
    }
  }`;

const mappingQuery = () => `
  *[_type == "pythonModule" && !(_id in path("drafts.**"))]{
    pythonModuleName,
    pythonModuleItem[] {
      pythonAlternativeContentLink,
      pythonApiEntry,
      referenceLink {
        _type == "reference" =>^-> {
          slug
        }
      }
    }
  }`;

const editorConfigQuery = () => `
  *[_type == "pythonEditorConfig" && !(_id in path("drafts.**"))]{
    welcomeVideo
  }`;

async function runQuery(query) {
  const url = `${API_BASE}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for query`);
  }
  const json = await res.json();
  return json.result;
}

async function main() {
  const outDir = path.join(__dirname, "..", "src", "documentation", "cms-snapshot");
  fs.mkdirSync(outDir, { recursive: true });

  let totalBytes = 0;
  const write = (name, data) => {
    const file = path.join(outDir, `${name}.json`);
    const body = JSON.stringify(data, null, 2);
    fs.writeFileSync(file, body);
    totalBytes += body.length;
    console.log(`  wrote ${name}.json (${body.length.toLocaleString()} bytes)`);
  };

  console.log("Mapping (language-independent):");
  write("mapping", await runQuery(mappingQuery()));

  console.log("\nEditor config (language-independent):");
  write("editor-config", await runQuery(editorConfigQuery()));

  for (const lang of LANGUAGES) {
    console.log(`\nLanguage: ${lang}`);
    write(`ideas.${lang}`, await runQuery(ideasQuery(lang)));
    write(`reference.${lang}`, await runQuery(toolkitQuery(lang)));
  }

  console.log(`\nTotal: ${totalBytes.toLocaleString()} bytes across ${2 + LANGUAGES.length * 2} files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
