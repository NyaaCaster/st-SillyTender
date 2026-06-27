export const featurePlaceholders = [
    {
        version: 'V1',
        title: '提示词调度',
        codename: 'Inner Universe',
        status: '计划中',
        description: '用于提示词插入、注意力调度、缓存命中与浅提示词控制。V0 仅保留入口占位。',
    },
    {
        version: 'V2',
        title: '破甲词注入系统',
        codename: 'Depth of Longing',
        status: '计划中',
        description: '面向多个模型的系统角色注入按钮，依赖提示词调度系统。V0 不启用。',
    },
    {
        version: 'V3',
        title: '长期记忆',
        codename: 'Stand Alone Complex',
        status: '计划中',
        description: '外部 SQLite 向量数据库与账号隔离记忆。V0 不创建后端或数据库。',
    },
    {
        version: 'V4',
        title: '外部知识库',
        codename: 'Mana Du Vortes',
        status: '计划中',
        description: '外部 RAG 知识库接入与用户管理。V0 仅展示规划卡片。',
    },
    {
        version: 'V5',
        title: '角色卡广场',
        codename: 'Aeria Gloris',
        status: '计划中',
        description: '外部角色卡库服务器的导入、发布与维护界面。V0 仅展示规划卡片。',
    },
];

export function renderFeaturePlaceholders(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    target.innerHTML = featurePlaceholders.map(feature => `
        <article class="sillytender-feature-card">
            <div class="sillytender-feature-card__meta">
                <span class="sillytender-badge">${feature.version}</span>
                <span class="sillytender-status">${feature.status}</span>
            </div>
            <h4>${feature.title}</h4>
            <div class="sillytender-codename">${feature.codename}</div>
            <p>${feature.description}</p>
        </article>
    `).join('');
}
