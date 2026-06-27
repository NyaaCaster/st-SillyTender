import { saveSettingsDebounced } from '../../../../../script.js';
import { renderExtensionTemplateAsync } from '../../../../extensions.js';
import { extensionFolderPath, extensionName, extensionVersion, templateIds } from '../core/constants.js';
import { bindSettingsControls, getSettings, updateSetting } from '../core/settings.js';
import { featurePlaceholders, renderFeaturePage } from './placeholders.js';
import { checkForUpdates, renderUpdateResult } from './version-check.js';

const templateBase = `third-party/${extensionName}/ui/templates`;

let drawerInitialized = false;

async function loadTemplate(templateId) {
    try {
        return await renderExtensionTemplateAsync(templateBase, templateId);
    } catch (error) {
        console.warn(`[SillyTender] renderExtensionTemplateAsync failed for ${templateId}, falling back to $.get.`, error);
        return $.get(`${extensionFolderPath}/ui/templates/${templateId}.html`);
    }
}

function getDrawerElements() {
    return {
        drawer: $('#sillytender_drawer'),
        icon: $('#sillytender_drawer_icon'),
        content: $('#sillytender_drawer_content'),
    };
}

function closeOtherDrawers() {
    $('.openIcon').not('#sillytender_drawer_icon').removeClass('openIcon').addClass('closedIcon');
    $('.openDrawer').not('#sillytender_drawer_content').removeClass('openDrawer').addClass('closedDrawer');
}

export function openSillyTenderDrawer(targetTab = undefined) {
    const { icon, content } = getDrawerElements();
    if (!icon.length || !content.length) return;

    const isClosed = icon.hasClass('closedIcon');
    if (isClosed) {
        closeOtherDrawers();
        icon.removeClass('closedIcon').addClass('openIcon');
        content.removeClass('closedDrawer').addClass('openDrawer');
    }

    if (targetTab) {
        switchTab(targetTab);
    }
}

function toggleSillyTenderDrawer() {
    const { icon, content } = getDrawerElements();
    if (!icon.length || !content.length) return;

    if (icon.hasClass('closedIcon')) {
        openSillyTenderDrawer();
        return;
    }

    icon.removeClass('openIcon').addClass('closedIcon');
    content.removeClass('openDrawer').addClass('closedDrawer');
}

function switchTab(tabName) {
    if (!tabName) return;

    $('[data-sillytender-tab]').removeClass('is-active');
    $(`[data-sillytender-tab="${tabName}"]`).addClass('is-active');
    $('[data-sillytender-page]').removeClass('is-active').hide();
    $(`[data-sillytender-page="${tabName}"]`).addClass('is-active').show();
    updateSetting('lastOpenedTab', tabName, false);
    saveSettingsDebounced();
}

async function refreshUpdateStatus() {
    const result = await checkForUpdates();
    renderUpdateResult(result);
}

function bindDrawerEvents() {
    $('#sillytender_drawer .drawer-toggle').off('click.sillytender').on('click.sillytender', toggleSillyTenderDrawer);
    $('#sillytender_drawer_icon').off('keydown.sillytender').on('keydown.sillytender', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleSillyTenderDrawer();
        }
    });

    $('[data-sillytender-tab]').off('click.sillytender').on('click.sillytender', event => {
        switchTab(event.currentTarget.dataset.sillytenderTab);
    });

    $('#sillytender_check_update').off('click.sillytender').on('click.sillytender', refreshUpdateStatus);
    $('#sillytender_open_drawer_from_settings').off('click.sillytender').on('click.sillytender', () => openSillyTenderDrawer('overview'));
}

export async function initSillyTenderUi() {
    if (drawerInitialized) return;

    const [settingsHtml, drawerHtml] = await Promise.all([
        loadTemplate(templateIds.settings),
        loadTemplate(templateIds.drawer),
    ]);

    if (!$('#sillytender_settings').length) {
        $('#extensions_settings').append(settingsHtml);
    }

    if (!$('#sillytender_drawer').length) {
        $('#extensions-settings-button').after(drawerHtml);
    }

    $('[data-sillytender-version]').text(extensionVersion);
    for (const feature of featurePlaceholders) {
        $(`[data-sillytender-page="${feature.id}"]`).html(renderFeaturePage(feature));
    }
    bindSettingsControls(document);
    bindDrawerEvents();

    const settings = getSettings();
    switchTab(settings.lastOpenedTab || 'overview');
    drawerInitialized = true;

    refreshUpdateStatus();
}
