// Inner Universe — CHAT_COMPLETION_PROMPT_READY 事件处理：原地改写 message array

import { eventSource, event_types } from '../../../../../../script.js';
import { oai_settings } from '../../../../../openai.js';
import { SUPPORTED_SOURCES } from './constants.js';
import { getPendingInjection, clearInjection } from './injection-store.js';
import {
    buildSearchContextBlock,
    buildSessionRulesBlock,
    buildOutputConstraints,
} from './prompt-builder.js';
import { getSettings } from '../settings.js';

let promptReadyListenerBound = false;

/**
 * 获取最后一个真实 user message 的索引
 * @param {Array} chat — message array
 * @returns {number} 索引，找不到返回 -1
 */
function findLastUserMessageIndex(chat) {
    for (let i = chat.length - 1; i >= 0; i--) {
        if (chat[i]?.role === 'user') {
            return i;
        }
    }
    return -1;
}

/**
 * 将文本追加到 message 的 content 上
 * 兼容 content 为字符串和 parts 数组两种情况
 * @param {Object} message
 * @param {string} text
 */
function appendToMessageContent(message, text) {
    if (!text) return;

    if (typeof message.content === 'string') {
        message.content += text;
    } else if (Array.isArray(message.content)) {
        // parts 数组：追加 { type: 'text', text }
        message.content.push({ type: 'text', text });
    }
    // 其他类型（如 undefined）不做处理
}

/**
 * CHAT_COMPLETION_PROMPT_READY 事件处理函数
 * @param {{ chat: Array, dryRun: boolean }} eventData
 */
function onPromptReady({ chat, dryRun }) {
    // dryRun 跳过
    if (dryRun) return;

    const settings = getSettings();
    const innerSettings = settings.innerUniverse || {};

    // 提示词调度总开关关闭，跳过
    if (!innerSettings.enabled) return;

    // 仅处理适配的 source
    const source = oai_settings?.chat_completion_source;
    if (!source || !SUPPORTED_SOURCES.includes(source)) return;

    // 找到最后一个真实 user message
    const lastUserIndex = findLastUserMessageIndex(chat);
    if (lastUserIndex === -1) return;

    const pending = getPendingInjection();
    const rosettaSettings = settings.rosettaStone || {};

    // 构建注入块（按 V1 规范顺序追加到 latest user）：
    // 1. <search_context> — 外部检索资料（V4 预留，当前始终为空）
    // 2. <session_rules>   — 第一方动态规则（V2 预留，当前始终为空）
    // 3. <output_constraints> — RosettaStone 常驻浅层提示词
    const searchContextBlock = pending?.searchContextText
        ? buildSearchContextBlock(pending.searchContextText)
        : '';
    const sessionRulesBlock = pending?.sessionRulesText
        ? buildSessionRulesBlock(pending.sessionRulesText)
        : '';
    const outputConstraintsBlock = buildOutputConstraints(rosettaSettings);

    // 追加到 latest user content
    appendToMessageContent(chat[lastUserIndex], searchContextBlock);
    appendToMessageContent(chat[lastUserIndex], sessionRulesBlock);
    appendToMessageContent(chat[lastUserIndex], outputConstraintsBlock);

    // 缓存命中：若启用，附加 cache_control 断点
    // cache_control 格式因 API 而异。当前仅对 DeepSeek 官方 API 启用
    //（DeepSeek 已知兼容 Anthropic cache_control 格式）。
    // custom（OpenAI 兼容）渠道由具体反代决定，默认不附加避免 400 错误。
    if (innerSettings.cacheEnabled && source === 'deepseek') {
        chat[lastUserIndex].cache_control = { type: 'ephemeral' };
    }

    // 清理 pending injection（注入块不持久化到聊天历史）
    clearInjection();
}

/**
 * 注册 CHAT_COMPLETION_PROMPT_READY 事件监听
 */
export function installEventHandler() {
    if (promptReadyListenerBound) return;
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    promptReadyListenerBound = true;
}

/**
 * 移除事件监听
 * 注意：SillyTavern eventSource 不提供标准 removeListener/off 方法，
 * 因此保留监听注册，在 onPromptReady 内部通过 innerSettings.enabled 总开关旁路。
 * 此函数保留供未来 SillyTavern 支持 off API 时使用。
 */
export function uninstallEventHandler() {
    // eventSource 不支持 removeListener，由 innerSettings.enabled 控制
}

/**
 * @returns {boolean}
 */
export function isEventHandlerInstalled() {
    return promptReadyListenerBound;
}
