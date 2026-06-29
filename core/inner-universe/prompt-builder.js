// Inner Universe — 构建注入块的纯函数

import { WRAP } from './constants.js';
import { renderTemplate, getEnabledEntries } from './rosetta-stone.js';

/**
 * 将外部检索文本包裹为 <search_context>…</search_context>
 * V4 预留，当前未使用
 * @param {string|null} text
 * @returns {string}
 */
export function buildSearchContextBlock(text) {
    if (!text) return '';
    return `\n\n${WRAP.SEARCH_CONTEXT_OPEN}\n${text}\n${WRAP.SEARCH_CONTEXT_CLOSE}`;
}

/**
 * 将第一方动态规则包裹为 <session_rules>…</session_rules>
 * V2 预留，当前未使用
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

/**
 * 将剥离收集的 ST 动态提示词构建为追加文本块。
 * 每项带可选的来源标签，内容保留原文。
 * @param {Array<{ content: string, label: string, trust: string }>} items
 * @returns {string}
 */
export function buildRelocatedBlock(items) {
    if (!items || items.length === 0) return '';

    const parts = [];
    for (const item of items) {
        const label = item.label ? `${item.label}\n` : '';
        parts.push(label + item.content);
    }

    return parts.join('\n\n');
}

/**
 * 将重定位内容 + RosettaStone 条目合并，整体包裹在 <output_constraints> 中。
 * 这样在 SillyTavern 服务器终端日志中，所有尾部注入内容显示为一个可辨识的块。
 * @param {Array<{ content: string, label: string, trust: string }>} relocatedItems
 * @param {Object} rosettaSettings
 * @param {{ char?: string, user?: string }} [context]
 * @returns {string}
 */
export function buildOutputConstraintsBlock(relocatedItems, rosettaSettings, context = {}) {
    const parts = [];

    // 重定位的 ST 动态提示词
    const relocatedBlock = buildRelocatedBlock(relocatedItems);
    if (relocatedBlock) {
        parts.push(relocatedBlock);
    }

    // RosettaStone 常驻浅层提示词
    const entries = getEnabledEntries(rosettaSettings);
    if (entries.length > 0) {
        const lines = entries.map(entry => renderTemplate(entry.template, context));
        parts.push(lines.join('\n\n'));
    }

    if (parts.length === 0) return '';

    const body = parts.join('\n\n');
    return `\n\n${WRAP.OUTPUT_CONSTRAINTS_OPEN}\n${body}\n${WRAP.OUTPUT_CONSTRAINTS_CLOSE}`;
}
