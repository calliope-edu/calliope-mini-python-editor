# Translation Update Guide

This document describes how to update translations from Crowdin for the Calliope mini Python Editor.

## Overview

The translation workflow involves multiple projects and file locations:

### Editor Project (calliope-mini-python-editor)

| Location | Format | Purpose |
|----------|--------|---------|
| `crowdin/translated/` | Crowdin format (`message` key) | Downloaded UI translations from Crowdin |
| `lang/` | FormatJS format (`defaultMessage` key) | Source translation files |
| `src/messages/` | Compiled AST format | Runtime UI messages (auto-generated) |
| `src/micropython/main/` | JSON | Typeshed files for code completion (copied from stubs project) |

### Stubs Project (micropython-calliope-stubs)

| Location | Format | Purpose |
|----------|--------|---------|
| `crowdin/translated/` | Crowdin format | Downloaded API translations |
| `lang/{lang}/typeshed/` | Python stub files | Translated Python type stubs |
| `typeshed.{lang}.json` | JSON | Generated typeshed bundles |

## Quick Start: Full Update with Script

The easiest way to update all translations is using the automation script:

```bash
./bin/update-translations.sh /path/to/extracted/crowdin/folder
```

This script:
1. Copies UI translations (`ui.en.json`) to `crowdin/translated/`
2. Copies API translations (`api.en.json`) to the stubs project
3. Runs all conversion and compilation steps
4. Regenerates typeshed files
5. Copies typeshed files back to the editor project

The Crowdin folder should contain language subfolders (e.g., `de/`, `fr/`, `nl/`, `es-ES/`) each with `ui.en.json` and `api.en.json`.

## Manual Step-by-Step Update Process

### 1. Download translations from Crowdin

Export translations from the Crowdin web interface. You will receive:
- `ui.en.json` - UI string translations
- `api.en.json` - API documentation translations

### 2. Copy UI translations

Place UI translation files in `crowdin/translated/`:

```bash
cp path/to/crowdin/de/ui.en.json crowdin/translated/ui.de.json
cp path/to/crowdin/fr/ui.en.json crowdin/translated/ui.fr.json
cp path/to/crowdin/nl/ui.en.json crowdin/translated/ui.nl.json
cp path/to/crowdin/es-ES/ui.en.json crowdin/translated/ui.es.json
```

Note: Spanish uses `es` internally (not `es-es`), so Crowdin's `es-ES/` maps to `ui.es.json`.

### 3. Copy API translations to stubs project

```bash
cp path/to/crowdin/de/api.en.json ../micropython-calliope-stubs/crowdin/translated/api.de.json
cp path/to/crowdin/fr/api.en.json ../micropython-calliope-stubs/crowdin/translated/api.fr.json
cp path/to/crowdin/nl/api.en.json ../micropython-calliope-stubs/crowdin/translated/api.nl.json
cp path/to/crowdin/es-ES/api.en.json ../micropython-calliope-stubs/crowdin/translated/api.es.json
```

### 4. Convert and compile UI translations

```bash
npm run i18n:convert
npm run i18n:compile
```

### 5. Build typeshed translations

```bash
cd ../micropython-calliope-stubs
./scripts/build-translations.sh
cd -
```

### 6. Copy typeshed files to editor

```bash
./bin/update-typeshed.sh
```

### 7. Verify the changes

Check that these files were updated:
- `lang/ui.*.json` - Source translations
- `src/messages/ui.*.json` - Compiled UI messages
- `src/micropython/main/typeshed.*.json` - Typeshed bundles

## File Format Reference

### Crowdin format (`crowdin/translated/`)

```json
{
  "about": {
    "message": "Translated text here",
    "description": "Context for translators"
  }
}
```

### FormatJS format (`lang/`)

```json
{
  "about": {
    "defaultMessage": "Translated text here",
    "description": "Context for translators"
  }
}
```

## Adding a New Language

To add support for a new language:

### 1. Editor Project Updates

1. Create the translation file in `crowdin/translated/ui.{lang}.json`

2. Run the conversion commands:
   ```bash
   npm run i18n:convert
   npm run i18n:compile
   ```

3. Add the language to `src/settings/settings.tsx` in the `allLanguages` array:
   ```typescript
   {
     id: "xx",
     name: "Native Name",
     enName: "English Name",
   }
   ```

   Note: Remove the `preview: true` flag when the language is ready for production.

4. Add the import case to `src/messages/TranslationProvider.tsx`:
   ```typescript
   case "xx":
     return (await import("./ui.xx.json")).default;
   ```

5. If the language requires special search indexing (for lunr), update `src/documentation/search/search.ts`

### 2. Stubs Project Updates

1. Add the language to `../micropython-calliope-stubs/scripts/build-translations.sh`:
   ```bash
   languages="de fr nl es xx"
   ```

2. Create the language folder:
   ```bash
   mkdir -p ../micropython-calliope-stubs/lang/xx
   ```

3. Add API translations to `../micropython-calliope-stubs/crowdin/translated/api.xx.json`

### 3. Update Scripts

Add the language mapping to `bin/update-translations.sh`:
```bash
languages=(de:de fr:fr nl:nl es-ES:es xx:xx)
```

The format is `crowdin_folder:internal_code` to handle cases where Crowdin uses different folder names (e.g., `es-ES` maps to `es`).

## Scripts Reference

### Editor Project Scripts

| Script | Description |
|--------|-------------|
| `npm run i18n:convert` | Converts between Crowdin and FormatJS formats |
| `npm run i18n:compile` | Compiles `lang/` files to `src/messages/` AST format |
| `bin/tidy-lang.js` | Sorts keys and validates variable placeholders |
| `bin/crowdin-convert.js` | Handles bidirectional format conversion |
| `bin/update-translations.sh` | Full automation script for Crowdin exports |
| `bin/update-typeshed.sh` | Copies typeshed files from stubs project |

### Stubs Project Scripts

| Script | Description |
|--------|-------------|
| `scripts/build-translations.sh` | Builds all language typeshed files |
| `scripts/browser-package.py` | Generates `typeshed.{lang}.json` bundles |
| `npm run i18n:crowdin-to-typeshed` | Converts API translations to stub files |
| `npm run i18n:typeshed-to-crowdin` | Exports English stubs for Crowdin |

## Troubleshooting

### Language not appearing in the app

Check that:
1. The language is listed in `src/settings/settings.tsx` in the `allLanguages` array
2. The language does NOT have `preview: true` (or you're testing in non-production)
3. The language has a case in `src/messages/TranslationProvider.tsx`

### Translation not loading

Ensure the language ID in `settings.tsx` matches the case in `TranslationProvider.tsx`. For example, if settings uses `id: "es"`, the TranslationProvider must use `case "es":` (not `case "es-es":`).

### Typeshed file not found error

If you see an error like `Cannot find module './main/typeshed.xx.json'`:

1. Ensure the typeshed file exists in `src/micropython/main/typeshed.{lang}.json`
2. The language code must match exactly (e.g., `es` not `es-es`)
3. Run `./bin/update-typeshed.sh` to copy files from the stubs project
4. In the stubs project, ensure the language folder exists in `lang/{lang}/`

### Variables not working

The `tidy-lang.js` script validates that variable placeholders like `{variableName}` match between English and translations. If validation fails, check that all variables are correctly preserved in the translated text.

### API documentation not translated

If the code completion hints are not translated:

1. Check that `api.{lang}.json` exists in `../micropython-calliope-stubs/crowdin/translated/`
2. Run `./scripts/build-translations.sh` in the stubs project
3. Run `./bin/update-typeshed.sh` in the editor project
4. Verify the typeshed file size increased (translated files are larger than untranslated)
