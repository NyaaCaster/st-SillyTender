# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

SillyTender is a SillyTavern third-party extension developed by NyaaCaster.

- This repository is currently the extension workspace. It may start with design/archive material only and grow into a standard SillyTavern extension layout.
- `.Dev/` is an archive/design-document directory. Read it for product intent, but do not treat it as runtime extension source unless a task explicitly says so.
- SillyTavern reference material is stored outside this repo at `H:\GitHub\.ref\SillyTavern`. Use it to confirm SillyTavern APIs, extension examples, and current upstream behavior before changing integration code.
- The local upstream reference currently includes `H:\GitHub\.ref\SillyTavern\SillyTavern-release` and example extensions such as `H:\GitHub\.ref\SillyTavern\st-extension-example`.

## Expected Extension Shape

SillyTavern third-party extensions are browser-side ES modules loaded from `public/scripts/extensions/third-party/<extension-folder>/` in a SillyTavern install.

A typical extension root contains:

- `manifest.json` declaring `display_name`, `loading_order`, `requires`, `optional`, `js`, `css`, `author`, `version`, and `homePage`.
- `index.js` as the manifest `js` entrypoint.
- Optional CSS such as `style.css`, referenced by manifest `css`.
- Optional HTML templates loaded by `index.js` with `$.get(...)` and inserted into SillyTavern settings or chat UI.
- Optional `assets/`, `components/`, `core/`, `services/`, `utils/`, or similar folders as the extension becomes modular.

Use a stable extension identifier consistently across `manifest.json`, settings keys, DOM IDs/classes, and folder-path constants. The user-facing display name is `SillyTender`; if the install folder remains `st-SillyTender`, browser import paths and `extension_settings[...]` keys should account for that folder name deliberately.

## SillyTavern Integration Notes

From the official extension example:

- Import extension helpers from `../../../extensions.js`, commonly `extension_settings`, `getContext`, and `loadExtensionSettings`.
- Import app-level helpers from `../../../../script.js`, commonly `saveSettingsDebounced`.
- Use `const extensionFolderPath = 'scripts/extensions/third-party/<extension-folder>'` for loading extension-local HTML/assets in the browser.
- Initialize UI inside `jQuery(async () => { ... })` after the extension module loads.
- Append settings HTML into `#extensions_settings` or `#extensions_settings2` depending on whether the UI is system/function oriented or visual/UI oriented.
- Persist user configuration under `extension_settings[extensionName]`, merge defaults when empty, update controls from settings, and call `saveSettingsDebounced()` after changes.

## Common Commands

This repo currently has no package manifest, build script, lint script, or test runner. Do not invent commands as if they already exist; add them to this section when the project introduces `package.json`, Playwright/Vitest/Jest, bundling, or TypeScript checks.

Useful reference commands for the local SillyTavern checkout:

```powershell
# Start the reference SillyTavern app
Set-Location "H:\GitHub\.ref\SillyTavern\SillyTavern-release"
npm start

# Run SillyTavern's upstream lint, useful when comparing style/API expectations
Set-Location "H:\GitHub\.ref\SillyTavern\SillyTavern-release"
npm run lint

# Start without CSRF while doing local integration/debug work only
Set-Location "H:\GitHub\.ref\SillyTavern\SillyTavern-release"
npm run start:no-csrf
```

Manual extension validation normally means installing or linking this repo into the reference SillyTavern install under:

```text
H:\GitHub\.ref\SillyTavern\SillyTavern-release\public\scripts\extensions\third-party\st-SillyTender
```

Then start SillyTavern, refresh the browser, and verify the extension appears in the Extensions UI and that its settings/state persist.

## Development Workflow

- Before coding against SillyTavern internals, inspect the upstream files in `H:\GitHub\.ref\SillyTavern\SillyTavern-release\public\scripts` rather than relying on memory.
- For extension skeleton decisions, compare against `H:\GitHub\.ref\SillyTavern\st-extension-example`.
- Keep runtime source separate from `.Dev/`; create root-level extension files (`manifest.json`, `index.js`, CSS/templates/assets) when implementation begins.
- If adding dependencies or tooling, prefer project-local scripts in this repo and update `Common Commands` with the exact commands that work here.
- If implementing prompt/message assembly, LLM chat behavior, RAG/tool context injection, or provider-specific request formatting, use the project/user prompt-architecture guidance before changing code.

## Reference Architecture

SillyTavern loads third-party extensions in the browser. The extension entrypoint is responsible for:

1. Declaring defaults and loading persisted settings via SillyTavern's `extension_settings` object.
2. Loading any extension-local UI fragments from `scripts/extensions/third-party/<extension-folder>/...`.
3. Registering DOM event handlers for settings and interactive UI.
4. Calling SillyTavern APIs through imports from upstream browser modules, not through a private backend unless the project explicitly adds one.
5. Saving configuration with SillyTavern's debounced settings save helper.

For larger extensions, keep SillyTavern-facing bootstrap code thin in `index.js` and move feature logic into modules grouped by responsibility, for example UI rendering, settings/state, SillyTavern API adapters, and domain logic.
