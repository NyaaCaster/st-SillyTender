// Inner Universe — Ephemeral pending injection 状态管理（不持久化，每轮内存态）

/**
 * @typedef {Object} PendingInjection
 * @property {string}  generationId      - 本轮生成唯一标识
 * @property {string|null} searchContextText - 外部检索内容（V4 预留, 当前始终 null）
 * @property {string}  sessionRulesText   - 第一方动态规则
 */

/** @type {PendingInjection|null} */
let pending = null;

/**
 * 创建新的 pending injection
 * @param {string} generationId
 * @returns {PendingInjection}
 */
export function createInjection(generationId) {
    pending = {
        generationId,
        searchContextText: null,
        sessionRulesText: '',
    };
    return pending;
}

/**
 * @returns {PendingInjection|null}
 */
export function getPendingInjection() {
    return pending;
}

/**
 * @param {string|null} text
 */
export function setSearchContext(text) {
    if (pending) {
        pending.searchContextText = text;
    }
}

/**
 * @param {string} text
 */
export function setSessionRules(text) {
    if (pending) {
        pending.sessionRulesText = text;
    }
}

/**
 * 清理 pending 状态
 */
export function clearInjection() {
    pending = null;
}
