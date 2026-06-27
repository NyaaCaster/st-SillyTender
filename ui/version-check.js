import { extensionFolderPath, extensionVersion, remoteManifestApiUrl, remoteManifestRawUrl } from '../core/constants.js';

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

async function getLocalManifest() {
    try {
        const response = await fetch(`/${extensionFolderPath}/manifest.json?ts=${Date.now()}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Local manifest HTTP ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('[SillyTender] Failed to fetch local manifest.', error);
        return { version: extensionVersion };
    }
}

async function getRemoteManifestFromGithubApi() {
    const response = await fetch(remoteManifestApiUrl, {
        headers: {
            Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-cache',
    });

    if (!response.ok) {
        throw new Error(`GitHub API HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = atob(data.content || '');
    return JSON.parse(content);
}

async function getRemoteManifestFromRaw() {
    const response = await fetch(remoteManifestRawUrl, {
        method: 'GET',
        cache: 'no-cache',
    });

    if (!response.ok) {
        throw new Error(`GitHub Raw HTTP ${response.status}`);
    }

    return response.json();
}

async function getRemoteManifest() {
    try {
        return await getRemoteManifestFromGithubApi();
    } catch (apiError) {
        console.warn('[SillyTender] GitHub API version check failed, falling back to raw manifest.', apiError);
        return getRemoteManifestFromRaw();
    }
}

export async function checkForUpdates() {
    const localManifest = await getLocalManifest();
    const currentVersion = localManifest?.version || extensionVersion;

    try {
        const remoteManifest = await getRemoteManifest();
        const remoteVersion = remoteManifest?.version;

        if (!remoteVersion) {
            throw new Error('远端 manifest 未提供 version 字段');
        }

        const hasUpdate = compareVersions(remoteVersion, currentVersion) > 0;
        return {
            ok: true,
            hasUpdate,
            remoteVersion,
            currentVersion,
            message: hasUpdate
                ? `发现新版本 ${remoteVersion}，当前版本 ${currentVersion}。`
                : `当前版本 ${currentVersion} 已是最新。`,
        };
    } catch (error) {
        console.error('[SillyTender] Failed to check remote version.', error);
        return {
            ok: false,
            hasUpdate: false,
            currentVersion,
            message: `当前版本 ${currentVersion}，版本检查失败。`,
        };
    }
}

export function renderUpdateResult(result) {
    document.querySelectorAll('[data-sillytender-version]').forEach(element => {
        element.textContent = result.currentVersion;
    });

    document.querySelectorAll('[data-sillytender-update-status]').forEach(element => {
        element.textContent = result.message;
        element.classList.toggle('sillytender-update-warning', Boolean(result.hasUpdate));
        element.classList.toggle('sillytender-update-muted', !result.ok);
    });
}
