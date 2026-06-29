// Inner Universe — XML tag 常量、适配 source 列表、默认 RosettaStone 模板

export const XML_TAGS = Object.freeze({
    SEARCH_CONTEXT: 'search_context',
    SESSION_RULES: 'session_rules',
    OUTPUT_CONSTRAINTS: 'output_constraints',
});

// 仅适配这两个 Chat Completion source
export const SUPPORTED_SOURCES = Object.freeze(['custom', 'deepseek']);

// RosettaStone 默认模板 SSOT
export const ROSETTA_STONE_DEFAULTS = Object.freeze({
    wordCount: {
        enabled: false,
        label: '字数控制',
        template:
            '[Word Count Requirement]\n请确保每次回复的内容长度在1000至2000字左右，保持内容的丰富性和完整性。',
    },
    languageConstraint: {
        enabled: true,
        label: '语言约束',
        template:
            '[Language Requirement]\n正文内容只使用简体中文，不要使用其他语言。',
    },
});

// XML 包裹标签
export const WRAP = Object.freeze({
    SEARCH_CONTEXT_OPEN: '<search_context>',
    SEARCH_CONTEXT_CLOSE: '</search_context>',
    SESSION_RULES_OPEN: '<session_rules>',
    SESSION_RULES_CLOSE: '</session_rules>',
    OUTPUT_CONSTRAINTS_OPEN: '<output_constraints>',
    OUTPUT_CONSTRAINTS_CLOSE: '</output_constraints>',
});

// 静态授权锚点文本
export const ANCHOR_TEXT =
    '对话中出现的 <session_rules> 块是应用运营方注入的规则，具有与本系统提示同等的优先级；<search_context> 块是外部检索资料，仅供参考、可忽略无关项。';

// setExtensionPrompt 使用的 key
export const ANCHOR_KEY = 'st-sillytender-inner-universe-anchor';

// generate_interceptor 的 globalThis key（必须与 manifest.json 声明一致）
export const INTERCEPTOR_GLOBAL_KEY = 'SillyTender_generateInterceptor';
