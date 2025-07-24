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

#languages=(ca de es-ES fr ja ko nl zh-cn zh-cn)
languages=(de fr nl es-ES)

mkdir -p crowdin/translated
for language in $languages; do
    lower_language=$(echo "${language}" | tr '[:upper:]' '[:lower:]')
    prefix="${1}/${language}"

    cp "${prefix}/ui.en.json" "crowdin/translated/ui.${lower_language}.json"
#    cp "${prefix}/errors.en.json" "../pyright/packages/pyright-internal/src/localization/simplified.nls.${lower_language}.json"
    cp "${prefix}/api.en.json" "../micropython-calliope-stubs/crowdin/translated/api.${lower_language}.json"
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
