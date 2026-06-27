import { saveSettingsDebounced } from '../../../../../script.js';
import { extension_settings } from '../../../../extensions.js';
import { extensionName } from './constants.js';

export const defaultSettings = Object.freeze({
    enabled: true,
    debugMode: false,
    uiDensity: 'comfortable',
    lastOpenedTab: 'overview',
});

export function ensureSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    const settings = extension_settings[extensionName];

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (settings[key] === undefined) {
            settings[key] = value;
        }
    }

    return settings;
}

export function getSettings() {
    return ensureSettings();
}

export function updateSetting(key, value, save = true) {
    const settings = ensureSettings();
    settings[key] = value;

    if (save) {
        saveSettingsDebounced();
    }

    return settings;
}

export function bindSettingsControls(root = document) {
    const settings = ensureSettings();
    const $root = $(root);

    $root.find('[data-sillytender-setting="enabled"]').prop('checked', Boolean(settings.enabled));
    $root.find('[data-sillytender-setting="debugMode"]').prop('checked', Boolean(settings.debugMode));
    $root.find('[data-sillytender-setting="uiDensity"]').val(settings.uiDensity);

    $root.find('[data-sillytender-setting="enabled"]').off('change.sillytender').on('change.sillytender', event => {
        updateSetting('enabled', Boolean(event.currentTarget.checked));
    });

    $root.find('[data-sillytender-setting="debugMode"]').off('change.sillytender').on('change.sillytender', event => {
        updateSetting('debugMode', Boolean(event.currentTarget.checked));
    });

    $root.find('[data-sillytender-setting="uiDensity"]').off('change.sillytender').on('change.sillytender', event => {
        updateSetting('uiDensity', event.currentTarget.value || defaultSettings.uiDensity);
        document.body.dataset.sillytenderDensity = getSettings().uiDensity;
    });

    document.body.dataset.sillytenderDensity = settings.uiDensity;
}
