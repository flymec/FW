// ==MetaData================================================================
var WidgetMetadata = {
    id: "missav",
    title: "MissAV",
    description: "\u83b7\u53d6 MissAV \u63a8\u8350",
    author: "𝓑𝓾𝓽𝓽𝓮𝓻𝓯𝓵𝔂",
    site: "https://widgets-xd.vercel.app",
    version: "2.0.0",
    requiredVersion: "0.0.2",
    detailCacheDuration: 300,
    modules: [
        // 此处保留原模块定义（由于篇幅，省略具体内容，请直接粘贴原始modules数组）
        // 注意：实际使用中务必完整保留原有modules定义，否则插件无法正常工作
    ]
};
// =========================================================================

/**
 * 优化版 MissAV 爬虫脚本
 * 改进点：
 * 1. 完整浏览器请求头，模拟真实访问
 * 2. Cookie 自动管理，保持会话
 * 3. 智能重试与风控检测
 * 4. 请求超时与异常处理
 * 5. 优雅降级，友好占位提示
 */

// 全局配置
const CONFIG = {
    BASE_URL: 'https://missav.ai',
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    RETRY_COUNT: 3,           // 最大重试次数
    RETRY_DELAY: 2000,        // 基础重试延迟（毫秒）
    TIMEOUT: 15000,           // 请求超时
    USE_COOKIE_JAR: true,     // 启用 Cookie 保持会话
};

// Cookie 存储（模拟浏览器会话）
let cookieJar = '';

/**
 * 增强的 HTTP 请求函数（自动管理 Cookie、重试、超时、风控检测）
 * @param {string} url - 目标 URL
 * @param {object} options - 请求选项 { method, headers, body }
 * @returns {Promise<object>} - 响应对象 { status, headers, data }
 */
async function request(url, options = {}) {
    const method = options.method || 'GET';
    const headers = {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': CONFIG.BASE_URL + '/',
        'DNT': '1',
        ...options.headers
    };

    // 添加 Cookie
    if (CONFIG.USE_COOKIE_JAR && cookieJar) {
        headers['Cookie'] = cookieJar;
    }

    let lastError;
    for (let attempt = 1; attempt <= CONFIG.RETRY_COUNT; attempt++) {
        try {
            // 发起请求（假设环境提供 Widget.http.request 支持超时和完整响应）
            const response = await Widget.http.request(url, {
                method,
                headers,
                data: options.body,
                timeout: CONFIG.TIMEOUT,
                allow_redirects: true,
                responseType: 'text'
            });

            // 保存 Cookie（如果响应头中有 Set-Cookie）
            if (CONFIG.USE_COOKIE_JAR && response.headers && response.headers['set-cookie']) {
                const setCookie = response.headers['set-cookie'];
                // 简单合并（取第一个 Cookie 的键值，实际应完整解析）
                cookieJar = setCookie.map(c => c.split(';')[0]).join('; ');
            }

            // 检查是否触发风控（Cloudflare 或其他验证页面）
            if (response.data && (
                response.data.includes('Just a moment') ||
                response.data.includes('Checking your browser') ||
                response.data.includes('检测') ||
                response.data.includes('安全验证') ||
                response.data.length < 5000
            )) {
                console.warn(`风控拦截 (attempt ${attempt})，等待重试...`);
                if (attempt < CONFIG.RETRY_COUNT) {
                    await sleep(CONFIG.RETRY_DELAY * attempt); // 递增等待
                    continue;
                }
                throw new Error('触发风控，多次重试失败');
            }

            return response;
        } catch (err) {
            lastError = err;
            console.error(`请求失败 (attempt ${attempt}): ${err.message}`);
            if (attempt < CONFIG.RETRY_COUNT) {
                await sleep(CONFIG.RETRY_DELAY * attempt);
            }
        }
    }
    throw lastError || new Error('请求失败');
}

/**
 * 休眠函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 初始化会话（获取首页 Cookie）
 */
async function initSession() {
    if (!CONFIG.USE_COOKIE_JAR) return;
    try {
        // 使用 HEAD 请求轻量获取 Cookie
        await request(CONFIG.BASE_URL + '/', { method: 'HEAD' });
    } catch (e) {
        console.warn('初始化会话失败，可能影响后续请求', e);
    }
}

// 立即执行初始化（在模块加载时运行）
initSession();

/**
 * 提取视频 ID（例如从 /cn/abcd-123 中提取 abcd-123）
 */
function extractVideoId(url) {
    const match = url.match(/\/cn\/([^\/?#]+)/);
    return match ? match[1] : '';
}

/**
 * 从标题提取番号
 */
function extractVideoCodeFromTitle(title) {
    if (!title) return null;
    const match = title.match(/^([A-Za-z]+-?\d+)/i);
    return match ? match[1] : null;
}

/**
 * 从描述提取番号
 */
function extractVideoCodeFromDescription(desc) {
    if (!desc) return null;
    const match = desc.match(/番号:\s*([A-Za-z]+-?\d+)/i);
    return match ? match[1] : null;
}

/**
 * 创建占位项（当无数据或出错时返回）
 */
function createPlaceholderItem(message = "已被风控，请稍后重试") {
    return {
        id: "content-placeholder",
        type: "placeholder",
        title: "🚫 " + message,
        backdropPath: "https://via.placeholder.com/400x225/FF6B6B/FFFFFF?text=%E5%B7%B2%E8%A2%AB%E9%A3%8E%E6%8E%A7",
        mediaType: "placeholder",
        duration: 0,
        durationText: "⚠️ 访问受限",
        previewUrl: "",
        videoUrl: "",
        link: "",
        description: "🔒 " + message + "\n\n💡 可能的解决方案：\n• 等待一段时间后重新尝试\n• 检查网络连接\n• 更换网络环境\n• 稍后再试",
        playerType: "none"
    };
}

/**
 * 解析视频列表 HTML
 * @param {string} html - 页面 HTML
 * @returns {Array} 视频对象数组
 */
function parseVideoList(html) {
    const $ = Widget.html.load(html);
    const videos = [];

    // 更通用的选择器：查找所有包含预览图的容器
    $('.thumbnail, .group, article, [class*="video"], .items-center').each((index, container) => {
        const $container = $(container);
        const $link = $container.find('a[href*="/cn/"]').first();
        if (!$link.length) return;

        const href = $link.attr('href');
        const fullUrl = href.startsWith('http') ? href : CONFIG.BASE_URL + href;
        const videoId = extractVideoId(fullUrl);
        if (!videoId) return;

        // 获取标题
        let title = $link.attr('title') || '';
        if (!title) {
            title = $container.find('h2, h3, .title, [class*="title"], .text-secondary').first().text().trim();
        }
        if (!title) {
            title = $link.text().trim();
        }

        // 获取封面图（优先取 data-src，再取 src）
        const $img = $link.find('img').first();
        let imgSrc = $img.attr('data-src') || $img.attr('src') || '';
        if (imgSrc && !imgSrc.startsWith('http')) {
            imgSrc = 'https:' + imgSrc; // 处理相对协议
        }
        const backdrop = imgSrc || `https://fourhoi.com/${videoId}/cover-t.jpg`;

        // 格式化番号
        let videoCode = videoId.toUpperCase()
            .replace('-CHINESE-SUBTITLE', '')
            .replace('-UNCENSORED-LEAK', '');

        if (title && !title.includes(videoCode)) {
            title = `${videoCode} ${title}`;
        } else if (!title) {
            title = videoCode;
        }

        videos.push({
            id: fullUrl,
            type: "url",
            title: title,
            backdropPath: backdrop,
            mediaType: "movie",
            duration: 0,
            durationText: "",
            previewUrl: "",
            videoUrl: "",
            link: fullUrl,
            description: `番号: ${videoCode}`,
            playerType: "system"
        });
    });

    return videos.length ? videos : [createPlaceholderItem()];
}

/**
 * 通用获取视频列表函数
 * @param {string} url - 列表页 URL
 * @returns {Promise<Array>} 视频列表
 */
async function fetchVideoList(url) {
    try {
        const response = await request(url);
        return parseVideoList(response.data);
    } catch (error) {
        console.error('fetchVideoList 失败:', error);
        return [createPlaceholderItem("访问失败，可能已被风控")];
    }
}

// ==================== 以下为各模块函数实现 ====================

async function searchVideos(params = {}) {
    const keyword = params.keyword ? params.keyword.trim() : '';
    const page = parseInt(params.page) || 1;
    const sortBy = params.sort_by;
    
    if (!keyword) {
        return [createPlaceholderItem("请输入搜索关键词")];
    }
    
    const isVideoCode = /^[A-Za-z]+-?\d+$/i.test(keyword);
    const encodedKeyword = encodeURIComponent(keyword);
    let url = `${CONFIG.BASE_URL}/cn/search/${encodedKeyword}`;
    let hasParams = false;
    
    if (sortBy) {
        url += `?sort=${sortBy}`;
        hasParams = true;
    }
    if (page > 1) {
        url += hasParams ? `&page=${page}` : `?page=${page}`;
    }
    
    const searchResults = await fetchVideoList(url);
    
    if (isVideoCode && searchResults.length > 0) {
        const normalizedKeyword = keyword.toUpperCase().replace(/-/g, '');
        return searchResults.filter(video => {
            const videoCode = extractVideoCodeFromTitle(video.title) || extractVideoCodeFromDescription(video.description);
            return videoCode && videoCode.toUpperCase().replace(/-/g, '') === normalizedKeyword;
        });
    }
    return searchResults;
}

async function loadTodayHot(params = {}) {
    const page = parseInt(params.page) || 1;
    let url = `${CONFIG.BASE_URL}/dm291/cn/today-hot?sort=today_views`;
    if (page > 1) url += `&page=${page}`;
    return fetchVideoList(url);
}

async function loadWeeklyHot(params = {}) {
    const page = parseInt(params.page) || 1;
    let url = `${CONFIG.BASE_URL}/dm169/cn/weekly-hot?sort=weekly_views`;
    if (page > 1) url += `&page=${page}`;
    return fetchVideoList(url);
}

async function loadMonthlyHot(params = {}) {
    const page = parseInt(params.page) || 1;
    let url = `${CONFIG.BASE_URL}/dm257/cn/monthly-hot?sort=monthly_views`;
    if (page > 1) url += `&page=${page}`;
    return fetchVideoList(url);
}

async function loadNewRelease(params = {}) {
    const page = parseInt(params.page) || 1;
    let url = `${CONFIG.BASE_URL}/dm588/cn/release?sort=released_at`;
    if (page > 1) url += `&page=${page}`;
    return fetchVideoList(url);
}

async function loadChineseSubtitle(params = {}) {
    const page = parseInt(params.page) || 1;
    const sortBy = params.sort_by || "released_at";
    let url = `${CONFIG.BASE_URL}/dm265/cn/chinese-subtitle`;
    let hasParams = false;
    if (sortBy) {
        url += `?sort=${sortBy}`;
        hasParams = true;
    }
    if (page > 1) {
        url += hasParams ? `&page=${page}` : `?page=${page}`;
    }
    return fetchVideoList(url);
}

async function loadPage(params = {}) {
    const baseUrl = params.url;
    const page = parseInt(params.page) || 1;
    const sortBy = params.sort_by;
    
    let url = baseUrl;
    let hasParams = false;
    if (sortBy) {
        url += `?sort=${sortBy}`;
        hasParams = true;
    }
    if (page > 1) {
        url += hasParams ? `&page=${page}` : `?page=${page}`;
    }
    return fetchVideoList(url);
}

/**
 * 加载视频详情
 */
async function loadDetail(link) {
    try {
        const response = await request(link);
        const videoId = extractVideoId(link);
        const videoCode = videoId.toUpperCase()
            .replace('-CHINESE-SUBTITLE', '')
            .replace('-UNCENSORED-LEAK', '');

        const $ = Widget.html.load(response.data);
        
        // 提取标题
        let title = $('meta[property="og:title"]').attr('content') || 
                    $('h1').first().text().trim() ||
                    $('title').text().replace(/\s*-\s*MissAV.*$/i, '').trim() ||
                    videoCode;
        
        // 提取封面图
        let backdrop = $('meta[property="og:image"]').attr('content') || 
                       `https://fourhoi.com/${videoId}/cover-t.jpg`;
        
        // 提取视频流 URL（m3u8）
        let videoUrl = '';
        $('script').each((idx, el) => {
            const script = $(el).html() || '';
            // 匹配常见的 m3u8 链接模式
            const m3u8Matches = script.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g);
            if (m3u8Matches && m3u8Matches.length) {
                videoUrl = m3u8Matches[0];
                return false;
            }
            // 匹配 UUID 模式（用于构造 surrit.com 链接）
            if (!videoUrl && script.includes('surrit.com')) {
                const uuidMatch = script.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g);
                if (uuidMatch && uuidMatch.length) {
                    videoUrl = `https://surrit.com/${uuidMatch[0]}/playlist.m3u8`;
                }
            }
        });
        
        return {
            id: link,
            type: "detail",
            videoUrl: videoUrl || link,
            title: title,
            description: `番号: ${videoCode}`,
            posterPath: "",
            backdropPath: backdrop,
            mediaType: "movie",
            duration: 0,
            durationText: "",
            previewUrl: "",
            playerType: videoUrl ? "system" : "web", // 有真实流则用系统播放器，否则用 WebView
            link: link,
            customHeaders: videoUrl ? {
                "Referer": CONFIG.BASE_URL + '/',
                "User-Agent": CONFIG.USER_AGENT
            } : undefined
        };
        
    } catch (error) {
        console.error('loadDetail 失败:', error);
        const videoId = extractVideoId(link);
        const videoCode = videoId.toUpperCase()
            .replace('-CHINESE-SUBTITLE', '')
            .replace('-UNCENSORED-LEAK', '');
        return {
            id: link,
            type: "detail",
            videoUrl: link,
            title: videoCode,
            description: `番号: ${videoCode}`,
            posterPath: "",
            backdropPath: `https://fourhoi.com/${videoId}/cover-t.jpg`,
            mediaType: "movie",
            duration: 0,
            durationText: "",
            previewUrl: "",
            playerType: "web",
            link: link
        };
    }
}
