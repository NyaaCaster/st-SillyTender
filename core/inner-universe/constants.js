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

// ============================================================================
// V1 提示词位置调整 — 动态键值定义
// ============================================================================

/**
 * 已知的每轮可变 extension_prompts 键值。
 * trust: 'first-party' — 用户/角色卡作者编写的第一方配置
 * trust: 'external'   — 外部检索/向量库结果，不进 system 角色
 */
export const DYNAMIC_EXTENSION_KEYS = Object.freeze([
    { key: '1_memory',             label: 'Summary',            trust: 'first-party' },
    { key: '2_floating_prompt',    label: "Author's Note",      trust: 'first-party' },
    { key: '3_vectors',            label: 'Vector Memory',      trust: 'external' },
    { key: '4_vectors_data_bank',  label: 'Data Bank',          trust: 'external' },
    { key: 'chromadb',             label: 'Smart Context',      trust: 'external' },
]);

/**
 * extension_prompts 键值前缀，标识 IN_CHAT 注入条目。
 * 这些键值对应的内容会被 populationInjectionPrompts splice 进历史中间。
 */
export const IN_CHAT_KEY_PREFIXES = Object.freeze([
    'customDepthWI_',   // World Info 关键词触发条目
    'DEPTH_PROMPT',     // 角色深度提示（含 DEPTH_PROMPT_0 等变体）
    'STORY_STRING',     // 故事字符串
]);

/**
 * 重定位内容的来源标签文本（追加到 latest user 时使用）
 */
export const SOURCE_LABELS = Object.freeze({
    worldInfo:    '[World Info]',
    authorsNote:  '[Author\'s Note]',
    summary:      '[Summary]',
    vectors:      '[Reference]',
    dataBank:     '[Reference]',
    chromadb:     '[Reference]',
    depthPrompt:  '[Depth Prompt]',
    storyString:  '[Story]',
});
