import { extensionName, extensionVersion } from './core/constants.js';
import { ensureSettings, getSettings } from './core/settings.js';
import { initSillyTenderUi, openSillyTenderDrawer } from './ui/drawer.js';

jQuery(async () => {
    ensureSettings();

    window.SillyTender = {
        extensionName,
        version: extensionVersion,
        getSettings,
        open: openSillyTenderDrawer,
    };

    try {
        await initSillyTenderUi();
        console.log(`[SillyTender] V${extensionVersion} loaded.`);
    } catch (error) {
        console.error('[SillyTender] 初始化失败。', error);
        globalThis.toastr?.error?.(`SillyTender 初始化失败：${error.message}`);
    }
});
