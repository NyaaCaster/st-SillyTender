import { extensionName, extensionVersion } from './core/constants.js';
import { ensureSettings, getSettings } from './core/settings.js';
import { initSillyTenderUi, openSillyTenderDrawer } from './ui/drawer.js';
import {
    installInterceptor,
    uninstallInterceptor,
    installAnchor,
    uninstallAnchor,
} from './core/inner-universe/interceptor.js';
import {
    installEventHandler,
} from './core/inner-universe/event-handler.js';

let innerUniverseInitialized = false;

/**
 * 初始化 Inner Universe 提示词调度中间件
 */
export function initInnerUniverse() {
    if (innerUniverseInitialized) return;

    const settings = getSettings();
    const innerSettings = settings.innerUniverse || {};

    if (!innerSettings.enabled) return;

    try {
        installInterceptor();
        installEventHandler();
        installAnchor();
        innerUniverseInitialized = true;
        console.log('[SillyTender] Inner Universe 提示词调度已启用。');
    } catch (error) {
        console.error('[SillyTender] Inner Universe 初始化失败。', error);
    }
}

/**
 * 拆卸 Inner Universe 中间件
 */
export function teardownInnerUniverse() {
    if (!innerUniverseInitialized) return;

    try {
        uninstallInterceptor();
        uninstallAnchor();
        // eventHandler 不支持标准的 removeListener，通过 total enable 标志旁路
        innerUniverseInitialized = false;
        console.log('[SillyTender] Inner Universe 提示词调度已关闭。');
    } catch (error) {
        console.error('[SillyTender] Inner Universe 拆卸失败。', error);
    }
}

/**
 * 根据当前设置状态同步 Inner Universe（设置变更后调用）
 */
export function syncInnerUniverse() {
    const settings = getSettings();
    const innerSettings = settings.innerUniverse || {};

    if (innerSettings.enabled && !innerUniverseInitialized) {
        initInnerUniverse();
    } else if (!innerSettings.enabled && innerUniverseInitialized) {
        teardownInnerUniverse();
    }
}

jQuery(async () => {
    ensureSettings();

    window.SillyTender = {
        extensionName,
        version: extensionVersion,
        getSettings,
        open: openSillyTenderDrawer,
        initInnerUniverse,
        teardownInnerUniverse,
        syncInnerUniverse,
    };

    try {
        await initSillyTenderUi();
        // UI 初始化后按当前设置状态同步 Inner Universe
        syncInnerUniverse();
        console.log(`[SillyTender] V${extensionVersion} loaded.`);
    } catch (error) {
        console.error('[SillyTender] 初始化失败。', error);
        globalThis.toastr?.error?.(`SillyTender 初始化失败：${error.message}`);
    }
});
