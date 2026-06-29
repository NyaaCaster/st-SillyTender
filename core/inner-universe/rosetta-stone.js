// Inner Universe — 常驻浅层提示词：默认模板 SSOT + 渲染 + 查询

import { ROSETTA_STONE_DEFAULTS } from './constants.js';

/**
 * 替换模板中的变量
 * 支持 {{char}} 和 {{user}}
 * @param {string} template
 * @param {{ char?: string, user?: string }} context
 * @returns {string}
 */
export function renderTemplate(template, context = {}) {
    let result = template;
    if (context.char !== undefined) {
        result = result.replace(/\{\{char\}\}/g, context.char);
    }
    if (context.user !== undefined) {
        result = result.replace(/\{\{user\}\}/g, context.user);
    }
    return result;
}

/**
 * 获取所有已启用且模板内容非空的条目
 * @param {Object} settings — { wordCount: { enabled, template }, languageConstraint: { enabled, template } }
 * @returns {Array<{ key: string, label: string, template: string }>}
 */
export function getEnabledEntries(settings) {
    const entries = [];
    for (const [key, defaultValue] of Object.entries(ROSETTA_STONE_DEFAULTS)) {
        const userSetting = settings?.[key] ?? {};
        const enabled = userSetting.enabled ?? defaultValue.enabled;
        const template = userSetting.template ?? defaultValue.template;
        if (enabled && template && template.trim()) {
            entries.push({
                key,
                label: defaultValue.label,
                template,
            });
        }
    }
    return entries;
}

/**
 * 获取指定条目的默认模板
 * @param {string} entryKey — 'wordCount' | 'languageConstraint'
 * @returns {{ label: string, template: string }|null}
 */
export function getDefaultTemplate(entryKey) {
    const def = ROSETTA_STONE_DEFAULTS[entryKey];
    if (!def) return null;
    return {
        label: def.label,
        template: def.template,
    };
}

export { ROSETTA_STONE_DEFAULTS };
