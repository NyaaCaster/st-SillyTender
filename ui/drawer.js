import { saveSettingsDebounced } from '../../../../../script.js';
import { renderExtensionTemplateAsync } from '../../../../extensions.js';
import { extensionFolderPath, extensionName, extensionVersion, templateIds } from '../core/constants.js';
import { bindSettingsControls, getSettings, getSettingValue, updateSetting } from '../core/settings.js';
import { featurePlaceholders, renderFeaturePage } from './placeholders.js';
import { checkForUpdates, renderUpdateResult } from './version-check.js';
import { ROSETTA_STONE_DEFAULTS } from '../core/inner-universe/constants.js';

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

/**
 * 绑定 Inner Universe V1 设置面板控件事件
 * @param {Document|Element} root
 */
function bindInnerUniverseControls(root) {
    const $root = $(root);

    // === 四个开关的 change 事件 ===
    // data-sillytender-setting 属性已在 core/settings.js 的 bindSettingsControls 中处理
    // 但 V1 嵌套 key 需要在这里单独绑定

    // 提示词调度总开关
    $root.find('[data-sillytender-setting="innerUniverse.enabled"]')
        .off('change.sillytender-iu')
        .on('change.sillytender-iu', event => {
            const checked = Boolean(event.currentTarget.checked);
            updateSetting('innerUniverse.enabled', checked);
            // 总开关切换即时同步 Inner Universe 状态
            if (window.SillyTender?.syncInnerUniverse) {
                window.SillyTender.syncInnerUniverse();
            }
        });

    // 缓存命中
    $root.find('[data-sillytender-setting="innerUniverse.cacheEnabled"]')
        .off('change.sillytender-iu')
        .on('change.sillytender-iu', event => {
            updateSetting('innerUniverse.cacheEnabled', Boolean(event.currentTarget.checked));
        });

    // RosettaStone 开关
    $root.find('[data-sillytender-setting="rosettaStone.wordCount.enabled"]')
        .off('change.sillytender-iu')
        .on('change.sillytender-iu', event => {
            updateSetting('rosettaStone.wordCount.enabled', Boolean(event.currentTarget.checked));
        });

    $root.find('[data-sillytender-setting="rosettaStone.languageConstraint.enabled"]')
        .off('change.sillytender-iu')
        .on('change.sillytender-iu', event => {
            updateSetting('rosettaStone.languageConstraint.enabled', Boolean(event.currentTarget.checked));
        });

    // === 编辑按钮：展开/收起 textarea ===
    $root.find('.sillytender-rosetta-edit').off('click.sillytender-iu').on('click.sillytender-iu', function () {
        const $row = $(this).closest('.sillytender-rosetta-row');
        const $editor = $row.find('.sillytender-rosetta-editor');
        $editor.slideToggle(150);
    });

    // === textarea 内容变更 → 持久化 ===
    $root.find('.sillytender-rosetta-textarea').off('input.sillytender-iu').on('input.sillytender-iu', function () {
        const settingKey = $(this).data('sillytender-setting');
        if (settingKey) {
            updateSetting(settingKey, $(this).val());
        }
    });

    // === 还原默认按钮：弹出确认对话框后恢复默认模板 ===
    $root.find('.sillytender-rosetta-reset').off('click.sillytender-iu').on('click.sillytender-iu', function () {
        const $row = $(this).closest('.sillytender-rosetta-row');
        const rosettaKey = $row.data('rosetta-key');
        const defaults = ROSETTA_STONE_DEFAULTS[rosettaKey];
        if (!defaults) return;

        // 使用 SillyTavern 风格的 confirm
        if (typeof Popup !== 'undefined' && Popup.show?.confirm) {
            Popup.show.confirm(
                `还原默认${defaults.label}模板`,
                `<p>确认将<strong>${defaults.label}</strong>模板还原为默认内容？当前编辑的内容将被覆盖。</p>`,
            ).then(confirmed => {
                if (confirmed) {
                    resetRosettaTemplate(rosettaKey, defaults, $row);
                }
            });
        } else {
            // fallback: 浏览器原生 confirm
            if (confirm(`确认将"${defaults.label}"模板还原为默认内容？当前编辑的内容将被覆盖。`)) {
                resetRosettaTemplate(rosettaKey, defaults, $row);
            }
        }
    });

    // === 初始值回填 ===
    refreshInnerUniverseControls($root);
}

/**
 * 还原 RosettaStone 模板为默认值
 */
function resetRosettaTemplate(key, defaults, $row) {
    updateSetting(`rosettaStone.${key}.template`, defaults.template);
    const $textarea = $row.find('.sillytender-rosetta-textarea');
    $textarea.val(defaults.template);
}

/**
 * 从当前 settings 回填 V1 控件值
 */
function refreshInnerUniverseControls($root) {
    const settings = getSettings();

    // 开关状态
    const iuEnabled = getSettingValue('innerUniverse.enabled');
    const iuCache = getSettingValue('innerUniverse.cacheEnabled');
    $root.find('[data-sillytender-setting="innerUniverse.enabled"]').prop('checked', Boolean(iuEnabled));
    $root.find('[data-sillytender-setting="innerUniverse.cacheEnabled"]').prop('checked', Boolean(iuCache));

    // RosettaStone 开关
    const wcEnabled = getSettingValue('rosettaStone.wordCount.enabled');
    const lcEnabled = getSettingValue('rosettaStone.languageConstraint.enabled');
    $root.find('[data-sillytender-setting="rosettaStone.wordCount.enabled"]').prop('checked', Boolean(wcEnabled));
    $root.find('[data-sillytender-setting="rosettaStone.languageConstraint.enabled"]').prop('checked', Boolean(lcEnabled));

    // textarea 内容
    const wcTemplate = getSettingValue('rosettaStone.wordCount.template');
    const lcTemplate = getSettingValue('rosettaStone.languageConstraint.template');
    $root.find('[data-sillytender-setting="rosettaStone.wordCount.template"]').val(wcTemplate ?? '');
    $root.find('[data-sillytender-setting="rosettaStone.languageConstraint.template"]').val(lcTemplate ?? '');
}

export async function initSillyTenderUi() {
    if (drawerInitialized) return;

    const [settingsHtml, drawerHtml, innerUniverseHtml] = await Promise.all([
        loadTemplate(templateIds.settings),
        loadTemplate(templateIds.drawer),
        loadTemplate('inner-universe-settings'),
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

    // V1: 将 inner-universe-settings 模板注入到 inner-universe 页面
    if (innerUniverseHtml) {
        const $iuPage = $('[data-sillytender-page="inner-universe"]');
        $iuPage.html(innerUniverseHtml);
        bindInnerUniverseControls($iuPage[0]);
    }

    const settings = getSettings();
    switchTab(settings.lastOpenedTab || 'overview');
    drawerInitialized = true;

    refreshUpdateStatus();
}
