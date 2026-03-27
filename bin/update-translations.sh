#!/bin/bash
#
# Partial automation of updating translations.
# This process expects sibling checkouts of pyright and the stubs projects.
#
# New languages require code change in:
# 1. Pyright to add to the switch in localization.ts
# 2. Editor updates in settings.tsx and TranslationProvider.tsx.
#

set -euo pipefail

if [ $# -eq 0 ]; then
  echo Missing argument to extracted Crowdin ZIP >&1
  exit 1
fi

# Format: "crowdin_folder:internal_code"
# Crowdin exports to folder names like "es-ES", but internally we use "es"
#languages=(ca:ca de:de es-ES:es fr:fr ja:ja ko:ko nl:nl zh-cn:zh-cn zh-tw:zh-tw)
languages=(de:de fr:fr nl:nl es-ES:es)

mkdir -p crowdin/translated
for mapping in "${languages[@]}"; do
    crowdin_folder="${mapping%%:*}"
    internal_code="${mapping##*:}"
    prefix="${1}/${crowdin_folder}"

    cp "${prefix}/ui.en.json" "crowdin/translated/ui.${internal_code}.json"
#    cp "${prefix}/errors.en.json" "../pyright/packages/pyright-internal/src/localization/simplified.nls.${internal_code}.json"
    cp "${prefix}/api.en.json" "../micropython-calliope-stubs/crowdin/translated/api.${internal_code}.json"
done

npm run i18n:convert
npm run i18n:compile

(
  cd ../micropython-calliope-stubs
  ./scripts/build-translations.sh
)

#NODE_OPTIONS=--openssl-legacy-provider ./bin/update-pyright.sh
./bin/update-typeshed.sh
# We sometimes have newer English stubs than translations and don't want to
# regress them as part of a translations update.
#git checkout -- src/micropython/main/typeshed.en.json
