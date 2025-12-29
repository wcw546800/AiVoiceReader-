/**
 * 解析 TXT 文本，将其分割为章节
 * @param {string} content - 完整的 TXT 内容
 * @returns {Array} - 分割后的章节数组 [{ title, content, index }]
 */
export const parseChapters = (content) => {
    // 1. 预处理：统一换行符
    const cleanContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. 正则匹配章节标题
    // 支持：第1章、第一章、第1节、Chapter 1、1. 等常见格式
    // 必须在行首 (^)
    const chapterRegex = /\n\s*(第[0-9零一二三四五六七八九十百千万]+[章节回]|\d+\.|Chapter \d+|[IVX]+\.)/g;

    // 如果没有匹配到任何章节，就当作一章处理
    if (!chapterRegex.test(cleanContent)) {
        return [{ title: "正文", content: cleanContent, index: 0 }];
    }

    // 重置正则索引
    chapterRegex.lastIndex = 0;

    const chapters = [];
    let lastIndex = 0;
    let match;
    let chapterIndex = 0;

    // 处理序章（如果有）
    match = chapterRegex.exec(cleanContent);
    if (match && match.index > 0) {
        const prologueContent = cleanContent.substring(0, match.index).trim();
        if (prologueContent.length > 0) {
            chapters.push({
                title: "序章/前言",
                content: prologueContent,
                index: chapterIndex++
            });
        }
    }

    // 循环匹配章节
    // 此时 match 已经是第一个匹配项了
    while (match) {
        const title = match[0].trim(); // 获取标题 "第1章"
        const startIndex = match.index + match[0].length; // 内容开始的位置

        // 查找下一个匹配项
        const nextMatch = chapterRegex.exec(cleanContent);
        const endIndex = nextMatch ? nextMatch.index : cleanContent.length;

        const bodyContent = cleanContent.substring(startIndex, endIndex).trim();

        if (bodyContent.length > 0) {
            chapters.push({
                title: title,
                content: bodyContent,
                index: chapterIndex++
            });
        }

        match = nextMatch;
    }

    // 如果分割失败（比如太短没匹配到），回退到整体
    if (chapters.length === 0) {
        return [{ title: "正文", content: cleanContent, index: 0 }];
    }

    return chapters;
};

/**
 * 将长段落切割为适合阅读的一行行（用于分页或渲染）
 * @param {string} text 
 * @returns {Array} 
 */
export const splitContentToLines = (text) => {
    if (!text) return [];
    return text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
};
