// Inner Universe — 构建注入块的纯函数

import { WRAP } from './constants.js';
import { renderTemplate, getEnabledEntries } from './rosetta-stone.js';

/**
 * 将外部检索文本包裹为 <search_context>…</search_context>
 * @param {string|null} text
 * @returns {string}
 */
export function buildSearchContextBlock(text) {
    if (!text) return '';
    return `\n\n${WRAP.SEARCH_CONTEXT_OPEN}\n${text}\n${WRAP.SEARCH_CONTEXT_CLOSE}`;
}

/**
 * 将第一方动态规则包裹为 <session_rules>…</session_rules>
 * @param {string} text
 * @returns {string}
 */
export function buildSessionRulesBlock(text) {
    if (!text) return '';
    return `\n\n${WRAP.SESSION_RULES_OPEN}\n${text}\n${WRAP.SESSION_RULES_CLOSE}`;
}

/**
 * 遍历已启用的 RosettaStone 条目，合并输出 <output_constraints>…</output_constraints>
 * @param {Object} rosettaSettings — { wordCount: { enabled, template }, languageConstraint: { enabled, template } }
 * @param {{ char?: string, user?: string }} [context] — 变量替换上下文
 * @returns {string}
 */
export function buildOutputConstraints(rosettaSettings, context = {}) {
    const entries = getEnabledEntries(rosettaSettings);
    if (entries.length === 0) return '';

    const lines = entries.map(entry => renderTemplate(entry.template, context));
    const body = lines.join('\n\n');
    return `\n\n${WRAP.OUTPUT_CONSTRAINTS_OPEN}\n${body}\n${WRAP.OUTPUT_CONSTRAINTS_CLOSE}`;
}
