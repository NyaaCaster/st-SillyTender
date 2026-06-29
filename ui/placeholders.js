export const featurePlaceholders = [
    {
        id: 'inner-universe',
        icon: 'fa-scroll',
        version: 'V1',
        title: '提示词调度',
        codename: 'Inner Universe',
        status: 'V1 已上线',
        description: '提示词插入中间件，通过 generate_interceptor + CHAT_COMPLETION_PROMPT_READY 实现 NyaaChat 标准保守降级布局。支持提示词调度总开关、缓存命中、字数控制与语言限制。',
    },
    {
        id: 'depth-of-longing',
        icon: 'fa-shield-heart',
        version: 'V2',
        title: '破甲词注入系统',
        codename: 'Depth of Longing',
        status: '计划中',
        description: '面向多个模型的系统角色注入按钮，依赖提示词调度系统。V0 不启用。',
    },
    {
        id: 'stand-alone-complex',
        icon: 'fa-database',
        version: 'V3',
        title: '长期记忆',
        codename: 'Stand Alone Complex',
        status: '计划中',
        description: '外部 SQLite 向量数据库与账号隔离记忆。V0 不创建后端或数据库。',
    },
    {
        id: 'mana-du-vortes',
        icon: 'fa-book-atlas',
        version: 'V4',
        title: '外部知识库',
        codename: 'Mana Du Vortes',
        status: '计划中',
        description: '外部 RAG 知识库接入与用户管理。V0 仅展示规划卡片。',
    },
    {
        id: 'aeria-gloris',
        icon: 'fa-id-card-clip',
        version: 'V5',
        title: '角色卡广场',
        codename: 'Aeria Gloris',
        status: '计划中',
        description: '外部角色卡库服务器的导入、发布与维护界面。V0 仅展示规划卡片。',
    },
];

export function getFeatureById(id) {
    return featurePlaceholders.find(feature => feature.id === id);
}

export function renderFeaturePage(feature) {
    if (!feature) return '';

    return `
        <div class="sillytender-feature-page-card">
            <div class="sillytender-feature-card__meta">
                <span class="sillytender-badge">${feature.version}</span>
                <span class="sillytender-status">${feature.status}</span>
            </div>
            <h4>${feature.title}</h4>
            <div class="sillytender-codename">${feature.codename}</div>
            <p>${feature.description}</p>
            <div class="sillytender-note">
                <strong>V0 占位：</strong>该系统的业务逻辑尚未启用，后续版本会按阶段接入独立设置、状态与运行逻辑。
            </div>
        </div>
    `;
}
