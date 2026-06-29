// Inner Universe — generate_interceptor 处理函数 + 静态授权锚点管理
//
// V1 提示词位置调整的核心逻辑在 event-handler.js（CHAT_COMPLETION_PROMPT_READY 事件）。
// 本文件负责：
//   1. 安装/卸载静态授权锚点（setExtensionPrompt IN_PROMPT）
//   2. 注册 generate_interceptor（manifest 声明需要；仅做 presence check，不做内容预收集）

import { extension_prompt_types, setExtensionPrompt } from '../../../../../../script.js';
import { ANCHOR_KEY, ANCHOR_TEXT } from './constants.js';
import { getSettings } from '../settings.js';

let interceptorInstallGenerationId = '';
let anchorInstalled = false;

/**
 * 安装静态授权锚点
 * 使用 setExtensionPrompt(IN_PROMPT, ...) 注入到系统提示区
 */
export function installAnchor() {
    setExtensionPrompt(ANCHOR_KEY, ANCHOR_TEXT, extension_prompt_types.IN_PROMPT, 0);
    anchorInstalled = true;
}

/**
 * 卸载静态授权锚点（传空值清除）
 */
export function uninstallAnchor() {
    setExtensionPrompt(ANCHOR_KEY, '', extension_prompt_types.IN_PROMPT, 0);
    anchorInstalled = false;
}

/**
 * @returns {boolean}
 */
export function isAnchorInstalled() {
    return anchorInstalled;
}

/**
 * 注册 globalThis 上的 interceptor 函数。
 * V1 的提示词位置调整在 CHAT_COMPLETION_PROMPT_READY 事件中完成，
 * generate_interceptor 仅做 presence check —— 确认提示词调度已启用。
 * @returns {string} 新的 generationId
 */
export function installInterceptor() {
    interceptorInstallGenerationId = `iu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    globalThis.SillyTender_generateInterceptor = async (chat, contextSize, abort, type) => {
        if (type !== 'chat') return;

        const settings = getSettings();
        const innerSettings = settings.innerUniverse || {};
        if (!innerSettings.enabled) return;

        // V1：提示词位置调整在 CHAT_COMPLETION_PROMPT_READY 中执行。
        // generate_interceptor 仅确保扩展在生成管线中存在。
    };

    return interceptorInstallGenerationId;
}

/**
 * 移除 globalThis 上的 interceptor
 */
export function uninstallInterceptor() {
    if (globalThis.SillyTender_generateInterceptor) {
        delete globalThis.SillyTender_generateInterceptor;
    }
    interceptorInstallGenerationId = '';
}
