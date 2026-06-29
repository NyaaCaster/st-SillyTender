# CLAUDE.md — st-SillyTender (Silly酒保)

This file provides guidance to Claude Code when working on the st-SillyTender SillyTavern extension.

## Project Context

st-SillyTender (display name: Silly酒保) is a SillyTavern third-party extension developed by NyaaCaster. It is a subsystem of the broader [SillyTender Framework](..), managed as a git submodule under `H:\GitHub\SillyTender`.

- This is the extension workspace only. Design/archive material for the overall project lives in `../.Dev/`.
- SillyTavern reference material: `H:\GitHub\.ref\SillyTavern`. Use it to confirm SillyTavern APIs, extension examples, and current upstream behavior before changing integration code.
- Reference sources: `H:\GitHub\.ref\SillyTavern\SillyTavern-release` and `H:\GitHub\.ref\SillyTavern\st-extension-example`.
- Remote: `https://github.com/NyaaCaster/st-SillyTender.git`
- Version: `0.0.1` (do NOT auto-increment; NyaaCaster controls versioning)

## Version Roadmap (within this extension)

- **V0** ✅ — Extension skeleton, drawer UI framework, settings persistence, version check, V1-V5 placeholders
- **V1** — Inner Universe: prompt scheduling middleware (see `../.Dev/sillytender-prompt-middleware-research.md`)
- **V2** — Depth of Longing: jailbreak injection (depends on V1)
- **V3** — Stand Alone Complex: long-term memory + NyaaAcount integration
- **V4** — Mana Du Vortes: external RAG knowledge base
- **V5** — Aeria Gloris: character card hub

## Expected Extension Shape

SillyTavern third-party extensions are browser-side ES modules loaded from `public/scripts/extensions/third-party/<extension-folder>/` in a SillyTavern install.

A typical extension root contains:
- `manifest.json` declaring `display_name`, `loading_order`, `requires`, `optional`, `js`, `css`, `author`, `version`, and `homePage`.
- `index.js` as the manifest `js` entrypoint.
- Optional CSS such as `style.css`, referenced by manifest `css`.
- Optional HTML templates loaded by `index.js` with `$.get(...)` and inserted into SillyTavern settings or chat UI.
- Optional `assets/`, `components/`, `core/`, `services/`, `utils/`, or similar folders as the extension becomes modular.

Use a stable extension identifier consistently across `manifest.json`, settings keys, DOM IDs/classes, and folder-path constants. The user-facing display name is `SillyTender`; the install folder is `st-SillyTender` — browser import paths and `extension_settings[...]` keys must account for this.

## SillyTavern Integration Notes

From the official extension example:

- Import extension helpers from `../../../extensions.js`, commonly `extension_settings`, `getContext`, and `loadExtensionSettings`.
- Import app-level helpers from `../../../../script.js`, commonly `saveSettingsDebounced`.
- Use `const extensionFolderPath = 'scripts/extensions/third-party/st-SillyTender'` for loading extension-local HTML/assets in the browser.
- Initialize UI inside `jQuery(async () => { ... })` after the extension module loads.
- Append settings HTML into `#extensions_settings` or `#extensions_settings2` depending on whether the UI is system/function oriented or visual/UI oriented.
- Persist user configuration under `extension_settings['st-SillyTender']`, merge defaults when empty, update controls from settings, and call `saveSettingsDebounced()` after changes.

## Compatibility

- Target: latest `SillyTavern-release`
- Minimum: `SillyTavern-1.15.0`
- UI: PC horizontal + mobile vertical responsive
- Only use APIs available in 1.15.0: `extension_settings`, `renderExtensionTemplateAsync()`, `saveSettingsDebounced()`
- Template loading: prefer `renderExtensionTemplateAsync('third-party/st-SillyTender/ui/templates', id)`, fallback to `$.get()`
- Drawer: follow SillyTavern conventions (`drawer` / `drawer-toggle` / `drawer-content` / `closedIcon` / `openIcon` / `closedDrawer` / `openDrawer` classes)

## File Structure (V0)

```
st-SillyTender/
├── manifest.json       # Extension declaration
├── index.js            # Browser ES module entrypoint
├── style.css           # Theme variables, responsive layout
├── core/
│   ├── constants.js    # Name, version, path, repo URL
│   └── settings.js     # Defaults, merge, control binding, save
└── ui/
    ├── drawer.js       # Template load, drawer insert, tab switch
    ├── placeholders.js # V1-V5 roadmap cards
    ├── version-check.js # Remote manifest check + downgrade notice
    └── templates/
        ├── drawer.html   # Overview / Roadmap / Settings tabs
        └── settings.html # Extension settings panel
```

## Development Workflow

- Before coding against SillyTavern internals, inspect the upstream files in `H:\GitHub\.ref\SillyTavern\SillyTavern-release\public\scripts` rather than relying on memory.
- For extension skeleton decisions, compare against `H:\GitHub\.ref\SillyTavern\st-extension-example`.
- If implementing prompt/message assembly, LLM chat behavior, RAG/tool context injection, or provider-specific request formatting, use the `llm-prompt-architecture-auditor` skill and consult `C:\Users\honyw\.docs\llm-chat-prompt-architecture-standard.md`.
- Version number `0.0.1` is locked — never auto-increment.

## Manual Validation

Link this repo into the reference SillyTavern install:

```text
H:\GitHub\.ref\SillyTavern\SillyTavern-release\public\scripts\extensions\third-party\st-SillyTender
```

Then start SillyTavern, refresh the browser, and verify:
1. Extension appears in Extensions panel
2. Top bar shows SillyTender icon
3. Drawer opens/closes, tabs switch
4. Settings persist across refresh
5. No blocking console errors
