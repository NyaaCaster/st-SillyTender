import { extensionVersion, remoteManifestUrl } from '../core/constants.js';

function compareVersions(left, right) {
    const leftParts = String(left).split('.').map(part => Number.parseInt(part, 10) || 0);
    const rightParts = String(right).split('.').map(part => Number.parseInt(part, 10) || 0);
    const maxLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLength; index += 1) {
        const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
        if (diff !== 0) return diff;
    }

    return 0;
}

export async function checkForUpdates() {
    try {
        const response = await fetch(remoteManifestUrl, {
            method: 'GET',
            cache: 'no-cache',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const remoteManifest = await response.json();
        const remoteVersion = remoteManifest?.version;

        if (!remoteVersion) {
            throw new Error('远端 manifest 未提供 version 字段');
        }

        const hasUpdate = compareVersions(remoteVersion, extensionVersion) > 0;
        return {
            ok: true,
            hasUpdate,
            remoteVersion,
            currentVersion: extensionVersion,
            message: hasUpdate
                ? `发现新版本 ${remoteVersion}，当前版本 ${extensionVersion}。`
                : `当前版本 ${extensionVersion} 已是最新。`,
        };
    } catch (error) {
        return {
            ok: false,
            hasUpdate: false,
            currentVersion: extensionVersion,
            message: `暂时无法检查更新：${error.message}`,
        };
    }
}

export function renderUpdateResult(result) {
    const elements = document.querySelectorAll('[data-sillytender-update-status]');
    elements.forEach(element => {
        element.textContent = result.message;
        element.classList.toggle('sillytender-update-warning', Boolean(result.hasUpdate));
        element.classList.toggle('sillytender-update-muted', !result.ok);
    });
}
