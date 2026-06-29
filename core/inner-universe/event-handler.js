// Inner Universe — CHAT_COMPLETION_PROMPT_READY 事件处理：
// 剥离 SillyTavern 原生动态提示词，重新追加到 latest user，符合 NyaaChat 标准四段结构

import { eventSource, event_types, extension_prompts } from '../../../../../../script.js';
import { oai_settings } from '../../../../../openai.js';
import {
    SUPPORTED_SOURCES,
    DYNAMIC_EXTENSION_KEYS,
    IN_CHAT_KEY_PREFIXES,
    SOURCE_LABELS,
} from './constants.js';
import {
    buildOutputConstraintsBlock,
} from './prompt-builder.js';
import { getSettings } from '../settings.js';

let promptReadyListenerBound = false;

// ============================================================================
// 定位函数
// ============================================================================

/**
 * 找到最后一个 user 消息的索引
 * @param {Array} chat
 * @returns {number}
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
 * 找到第一个 user 消息的索引
 * @param {Array} chat
 * @returns {number}
 */
function findFirstUserMessageIndex(chat) {
    for (let i = 0; i < chat.length; i++) {
        if (chat[i]?.role === 'user') {
            return i;
        }
    }
    return -1;
}

// ============================================================================
// 动态内容识别
// ============================================================================

/**
 * 构建已知动态内容 → 标签的映射表（从 extension_prompts 读取当前值）
 * @returns {Map<string, { label: string, trust: string }>}
 */
function getDynamicContentMap() {
    /** @type {Map<string, { label: string, trust: string }>} */
    const map = new Map();

    // 已知的系统前缀动态键值
    for (const { key, label, trust } of DYNAMIC_EXTENSION_KEYS) {
        const entry = extension_prompts[key];
        const value = entry?.value?.trim();
        if (value) {
            map.set(value, { label, trust });
        }
    }

    // IN_CHAT 注入键值（World Info、Depth Prompt、Story String）
    for (const extKey of Object.keys(extension_prompts)) {
        const matchesInChatPrefix = IN_CHAT_KEY_PREFIXES.some(prefix => extKey.startsWith(prefix));
        if (!matchesInChatPrefix) continue;

        const entry = extension_prompts[extKey];
        const value = entry?.value?.trim();
        if (!value) continue;

        // 确定标签
        let label;
        if (extKey.startsWith('customDepthWI_')) {
            label = SOURCE_LABELS.worldInfo;
        } else if (extKey.startsWith('DEPTH_PROMPT')) {
            label = SOURCE_LABELS.depthPrompt;
        } else if (extKey.startsWith('STORY_STRING')) {
            label = SOURCE_LABELS.storyString;
        } else {
            label = '';
        }
        map.set(value, { label, trust: 'first-party' });
    }

    return map;
}

/**
 * 检查某段文本是否匹配已知动态内容
 * @param {string} content
 * @param {Map<string, { label: string, trust: string }>} dynamicMap
 * @returns {{ label: string, trust: string } | null}
 */
function matchDynamicContent(content, dynamicMap) {
    const trimmed = content?.trim();
    if (!trimmed) return null;

    // 精确匹配优先
    for (const [value, meta] of dynamicMap) {
        if (trimmed.includes(value)) {
            return meta;
        }
    }
    return null;
}

// ============================================================================
// 剥离函数
// ============================================================================

/**
 * 从历史区收集并剥离所有 system 消息（这些是 IN_CHAT depth 注入产物）
 * @param {Array} chat
 * @param {number} firstUserIdx
 * @param {number} lastUserIdx
 * @param {Map<string, { label: string, trust: string }>} dynamicMap
 * @returns {Array<{ content: string, label: string, trust: string }>}
 */
function collectHistorySystemMessages(chat, firstUserIdx, lastUserIdx, dynamicMap) {
    /** @type {Array<{ content: string, label: string, trust: string }>} */
    const items = [];

    // 从后往前扫描，避免 splice 索引偏移
    for (let i = lastUserIdx - 1; i > firstUserIdx; i--) {
        if (chat[i]?.role === 'system') {
            const content = (chat[i].content || '').trim();
            if (!content) {
                chat.splice(i, 1);
                continue;
            }

            const matched = matchDynamicContent(content, dynamicMap);
            items.unshift({
                content,
                label: matched?.label || '',
                trust: matched?.trust || 'first-party',
            });

            chat.splice(i, 1);
        }
    }

    return items;
}

/**
 * 从静态前缀中收集并剥离匹配已知动态键值的 system 消息
 * 仅当 squashSystemMessages 关闭时有效（否则前缀已合并为单条消息）
 * @param {Array} chat
 * @param {number} firstUserIdx
 * @param {Map<string, { label: string, trust: string }>} dynamicMap
 * @returns {Array<{ content: string, label: string, trust: string }>}
 */
function collectPrefixDynamicMessages(chat, firstUserIdx, dynamicMap) {
    /** @type {Array<{ content: string, label: string, trust: string }>} */
    const items = [];

    const squashEnabled = oai_settings?.squash_system_messages;
    if (squashEnabled) {
        // 前缀已合并，无法精确分离动态内容，跳过前缀剥离
        console.debug('[SillyTender] squashSystemMessages 开启，跳过静态前缀动态内容剥离');
        return items;
    }

    // 从后往前扫描前缀区
    for (let i = firstUserIdx - 1; i >= 0; i--) {
        if (chat[i]?.role !== 'system') continue;

        const content = (chat[i].content || '').trim();
        const matched = matchDynamicContent(content, dynamicMap);

        if (matched) {
            items.unshift({
                content,
                label: matched.label,
                trust: matched.trust,
            });
            chat.splice(i, 1);
        }
    }

    return items;
}

// ============================================================================
// 内容追加
// ============================================================================

/**
 * 将文本追加到 message 的 content 上，兼容 string 和 parts 数组
 * @param {Object} message
 * @param {string} text
 */
function appendToMessageContent(message, text) {
    if (!text) return;

    if (typeof message.content === 'string') {
        message.content += text;
    } else if (Array.isArray(message.content)) {
        message.content.push({ type: 'text', text });
    }
}

// ============================================================================
// 主事件处理
// ============================================================================

/**
 * CHAT_COMPLETION_PROMPT_READY 事件处理函数
 * 剥离 ST 原生动态提示词，重新追加到 latest user
 * @param {{ chat: Array, dryRun: boolean }} eventData
 */
function onPromptReady({ chat, dryRun }) {
    if (dryRun) return;

    const settings = getSettings();
    const innerSettings = settings.innerUniverse || {};
    if (!innerSettings.enabled) return;

    const source = oai_settings?.chat_completion_source;
    if (!source || !SUPPORTED_SOURCES.includes(source)) return;

    const lastUserIndex = findLastUserMessageIndex(chat);
    if (lastUserIndex === -1) return;

    const firstUserIndex = findFirstUserMessageIndex(chat);

    // 构建动态内容映射表
    const dynamicMap = getDynamicContentMap();

    // 阶段 1：剥离历史中间的系统消息（IN_CHAT 注入）
    const relocatedItems = (firstUserIndex !== -1 && firstUserIndex < lastUserIndex)
        ? collectHistorySystemMessages(chat, firstUserIndex, lastUserIndex, dynamicMap)
        : [];

    // 阶段 2：剥离静态前缀中的动态系统消息
    if (firstUserIndex !== -1) {
        const prefixItems = collectPrefixDynamicMessages(chat, firstUserIndex, dynamicMap);
        relocatedItems.unshift(...prefixItems);
    }

    // 重新定位 latest user —— 剥离操作通过 splice 改变了数组长度，原索引已失效
    const newLastUserIndex = findLastUserMessageIndex(chat);
    if (newLastUserIndex === -1) return;

    // 阶段 3：重定位内容 + RosettaStone 合并包裹在 <output_constraints> 中追加到 latest user
    const rosettaSettings = settings.rosettaStone || {};
    const injectionBlock = buildOutputConstraintsBlock(relocatedItems, rosettaSettings);
    appendToMessageContent(chat[newLastUserIndex], injectionBlock);

    // 阶段 4：缓存命中断点
    // 断点放在 latest user 之前的那条消息上（通常是最后一条 assistant），
    // 这样静态前缀 + 全部历史被缓存，只有每轮变化的 latest user（含注入块）在缓存外。
    if (innerSettings.cacheEnabled && source === 'deepseek') {
        const cacheBreakIndex = newLastUserIndex - 1;
        if (cacheBreakIndex >= 0 && chat[cacheBreakIndex]) {
            chat[cacheBreakIndex].cache_control = { type: 'ephemeral' };
        }
    }
}

// ============================================================================
// 安装 / 卸载
// ============================================================================

export function installEventHandler() {
    if (promptReadyListenerBound) return;
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    promptReadyListenerBound = true;
}

export function uninstallEventHandler() {
    // eventSource 不支持 removeListener，由 innerSettings.enabled 控制
}

export function isEventHandlerInstalled() {
    return promptReadyListenerBound;
}
