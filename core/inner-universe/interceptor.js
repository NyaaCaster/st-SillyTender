// Inner Universe — generate_interceptor 处理函数 + 静态授权锚点管理

import { extension_prompt_types, setExtensionPrompt } from '../../../../../../script.js';
import { ANCHOR_KEY, ANCHOR_TEXT } from './constants.js';
import { createInjection, setSessionRules } from './injection-store.js';
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
 * 注册 globalThis 上的 interceptor 函数
 * 每次调用时更新 generationId，防止重复注册导致的引用紊乱
 * @returns {string} 新的 generationId
 */
export function installInterceptor() {
    interceptorInstallGenerationId = `iu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    globalThis.SillyTender_generateInterceptor = async (chat, contextSize, abort, type) => {
        // 非 Chat Completion 模式跳过
        if (type !== 'chat') return;

        const settings = getSettings();
        const innerSettings = settings.innerUniverse || {};

        // 如果提示词调度总开关关闭，跳过
        if (!innerSettings.enabled) return;

        const generationId = `iu-gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        createInjection(generationId);

        // V1: 第一方动态规则（session_rules）预留给 V2（Depth of Longing）
        // 此处暂写入空字符串，V2 将通过 setSessionRules() 写入破甲词等动态规则
        setSessionRules('');
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
