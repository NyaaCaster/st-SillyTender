import { saveSettingsDebounced } from '../../../../../script.js';
import { extension_settings } from '../../../../extensions.js';
import { extensionName } from './constants.js';
import { ROSETTA_STONE_DEFAULTS } from './inner-universe/constants.js';

export const defaultSettings = Object.freeze({
    enabled: true,
    debugMode: false,
    uiDensity: 'comfortable',
    lastOpenedTab: 'overview',

    // V1 Inner Universe — 提示词调度
    innerUniverse: {
        enabled: false,
        cacheEnabled: false,
    },

    // V1 RosettaStone — 常驻浅层提示词
    rosettaStone: {
        wordCount: {
            enabled: false,
            template: ROSETTA_STONE_DEFAULTS.wordCount.template,
        },
        languageConstraint: {
            enabled: true,
            template: ROSETTA_STONE_DEFAULTS.languageConstraint.template,
        },
    },
});

/**
 * 确保 settings 中存在所有默认值（浅层 merge 顶层 + 深层补齐嵌套对象）
 * @returns {Object}
 */
export function ensureSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    const settings = extension_settings[extensionName];

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (settings[key] === undefined) {
            settings[key] = structuredClone?.(value) ?? JSON.parse(JSON.stringify(value));
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // 深层补齐嵌套对象（如 innerUniverse, rosettaStone）
            for (const [subKey, subValue] of Object.entries(value)) {
                if (settings[key][subKey] === undefined) {
                    settings[key][subKey] = structuredClone?.(subValue) ?? JSON.parse(JSON.stringify(subValue));
                } else if (typeof subValue === 'object' && subValue !== null && !Array.isArray(subValue)) {
                    // 再深一层（如 rosettaStone.wordCount）
                    for (const [deepKey, deepValue] of Object.entries(subValue)) {
                        if (settings[key][subKey][deepKey] === undefined) {
                            settings[key][subKey][deepKey] = deepValue;
                        }
                    }
                }
            }
        }
    }

    return settings;
}

export function getSettings() {
    return ensureSettings();
}

/**
 * @param {string} key — 支持点号分隔的嵌套路径，如 'innerUniverse.enabled'
 * @param {*} value
 * @param {boolean} [save=true]
 */
export function updateSetting(key, value, save = true) {
    const settings = ensureSettings();
    const parts = key.split('.');
    let target = settings;

    for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]] || typeof target[parts[i]] !== 'object') {
            target[parts[i]] = {};
        }
        target = target[parts[i]];
    }

    target[parts[parts.length - 1]] = value;

    if (save) {
        saveSettingsDebounced();
    }

    return settings;
}

/**
 * @param {string} key — 支持点号分隔的嵌套路径
 * @returns {*}
 */
export function getSettingValue(key) {
    const settings = getSettings();
    const parts = key.split('.');
    let value = settings;

    for (const part of parts) {
        if (value == null || typeof value !== 'object') return undefined;
        value = value[part];
    }

    return value;
}

/**
 * 绑定 settings 控件事件
 * @param {Document|Element} [root=document]
 */
export function bindSettingsControls(root = document) {
    const settings = ensureSettings();
    const $root = $(root);

    // V0 现有控件
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
