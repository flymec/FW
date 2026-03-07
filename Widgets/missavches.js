// ==MetaData================================================================
WidgetMetadata = {
    id: "missav_makka_play",
    title: "MissAV_ovo",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "简易的missav模块（增强版）",
    version: "2.3.0",
    requiredVersion: "0.0.1",
    site: "https://missav.ai",
    modules: [
        {
            title: "浏览视频",
            functionName: "loadList",
            type: "video",
            params: [
                { name: "page", title: "页码", type: "page" },
                { 
                    name: "category", 
                    title: "分类", 
                    type: "enumeration", 
                    value: "dm588/cn/release",
                    enumOptions: [
                        { title: "🆕 最新发布", value: "dm588/cn/release" },
                        { title: "🔥 本周热门", value: "dm169/cn/weekly-hot" },
                        { title: "🌟 月度热门", value: "dm257/cn/monthly-hot" },
                        { title: "👑 人气最高（总榜）", value: "dm588/cn/release?sort=views" },  // 新增
                        { title: "🔞 无码流出", value: "dm621/cn/uncensored-leak" },
                        { title: "🇯🇵 东京热", value: "dm29/cn/tokyohot" },
                        { title: "🇨🇳 中文字幕", value: "dm265/cn/chinese-subtitle" }
                    ] 
                },
                {
                    name: "sort",
                    title: "排序",
                    type: "enumeration",
                    value: "released_at",
                    enumOptions: [
                        { title: "发布日期", value: "released_at" },
                        { title: "今日浏览", value: "today_views" },
                        { title: "总浏览量", value: "views" },
                        { title: "收藏数", value: "saved" }
                    ]
                }
            ]
        },
        {
            title: "🔍 搜索视频",
            functionName: "searchList",
            type: "video",
            params: [
                { name: "keyword", title: "关键词", type: "input", value: "" },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};
// =========================================================================

// -------------------- 全局配置 --------------------
const CONFIG = {
    BASE_URL: "https://missav.ai",
    USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    RETRY_COUNT: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 15000,
    USE_COOKIE_JAR: true,
};

let cookieJar = "";

/**
 * 增强请求函数（自动管理 Cookie、重试、风控检测）
 */
async function request(url, options = {}) {
    const method = options.method || "GET";
    const headers = {
        "User-Agent": CONFIG.USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": CONFIG.BASE_URL + "/",
        "DNT": "1",
        ...options.headers,
    };

    if (CONFIG.USE_COOKIE_JAR && cookieJar) {
        headers["Cookie"] = cookieJar;
    }

    for (let attempt = 1; attempt <= CONFIG.RETRY_COUNT; attempt++) {
        try {
            const response = await Widget.http.request(url, {
                method,
                headers,
                data: options.body,
                timeout: CONFIG.TIMEOUT,
                allow_redirects: true,
                responseType: "text",
            });

            // 保存 Cookie
            if (CONFIG.USE_COOKIE_JAR && response.headers && response.headers["set-cookie"]) {
                const setCookie = response.headers["set-cookie"];
                cookieJar = setCookie.map(c => c.split(";")[0]).join("; ");
            }

            // 检测风控页面
            if (
                response.data &&
                (response.data.includes("Just a moment") ||
                 response.data.includes("Checking your browser") ||
                 response.data.includes("检测") ||
                 response.data.includes("安全验证") ||
                 response.data.length < 5000)
            ) {
                console.warn(`风控拦截 (attempt ${attempt})，等待重试...`);
                if (attempt < CONFIG.RETRY_COUNT) {
                    await sleep(CONFIG.RETRY_DELAY * attempt);
                    continue;
                }
                throw new Error("触发风控，多次重试失败");
            }

            return response;
        } catch (err) {
            console.error(`请求失败 (attempt ${attempt}): ${err.message}`);
            if (attempt < CONFIG.RETRY_COUNT) {
                await sleep(CONFIG.RETRY_DELAY * attempt);
            } else {
                throw err;
            }
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 初始化会话（预先获取 Cookie）
(async () => {
    if (CONFIG.USE_COOKIE_JAR) {
        try {
            await request(CONFIG.BASE_URL + "/", { method: "HEAD" });
        } catch (e) {
            console.warn("初始化会话失败", e);
        }
    }
})();

// -------------------- 公共解析函数 --------------------
function parseVideoList(html) {
    if (!html || html.includes("Just a moment")) {
        return [{ id: "err_cf", type: "text", title: "⛔ 被风控拦截", subTitle: "请稍后重试或更换网络" }];
    }

    const $ = Widget.html.load(html);
    const results = [];

    // 使用更通用的选择器
    $("div.group, article, .thumbnail").each((i, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/cn/']").first();
        const href = $link.attr("href");
        if (!href) return;

        const title = $link.text().trim() || $el.find(".text-secondary").text().trim();
        const $img = $el.find("img").first();
        const imgSrc = $img.attr("data-src") || $img.attr("src") || "";
        const duration = $el.find(".absolute.bottom-1.right-1").text().trim() || "未知时长";

        // 提取番号
        const videoId = href.split('/').pop().replace(/-uncensored-leak|-chinese-subtitle/g, '').toUpperCase();
        // 高清封面（fourhoi.com CDN）
        const coverUrl = `https://fourhoi.com/${videoId.toLowerCase()}/cover-t.jpg`;

        results.push({
            id: href,
            type: "link",
            title: title,
            coverUrl: coverUrl || (imgSrc.startsWith("http") ? imgSrc : "https:" + imgSrc),
            link: href.startsWith("http") ? href : CONFIG.BASE_URL + href,
            description: `⏱️ ${duration} | 🏷️ ${videoId}`,
            customHeaders: {
                "User-Agent": CONFIG.USER_AGENT,
                "Referer": CONFIG.BASE_URL + "/",
            },
        });
    });

    return results.length > 0 ? results : [{ id: "empty", type: "text", title: "😢 没有找到视频" }];
}

// -------------------- 模块函数 --------------------
// 1. 浏览列表（支持分类+排序，自动处理带查询参数的分类）
async function loadList(params = {}) {
    const { page = 1, category = "dm588/cn/release", sort = "released_at" } = params;

    let url;
    if (category.includes("?")) {
        // 如果分类值中已包含查询参数（如人气最高），直接使用
        url = `${CONFIG.BASE_URL}/${category}`;
        if (page > 1) url += (category.includes("?") ? "&" : "?") + `page=${page}`;
    } else {
        url = `${CONFIG.BASE_URL}/${category}?sort=${sort}`;
        if (page > 1) url += `&page=${page}`;
    }

    try {
        const res = await request(url);
        return parseVideoList(res.data);
    } catch (e) {
        return [{ id: "err", type: "text", title: "❌ 加载失败", subTitle: e.message }];
    }
}

// 2. 搜索视频
async function searchList(params = {}) {
    const { page = 1, keyword } = params;
    if (!keyword) {
        return [{ id: "tip", type: "text", title: "🔎 请输入关键词开始搜索" }];
    }

    let url = `${CONFIG.BASE_URL}/cn/search/${encodeURIComponent(keyword)}`;
    if (page > 1) url += `?page=${page}`;

    try {
        const res = await request(url);
        return parseVideoList(res.data);
    } catch (e) {
        return [{ id: "err", type: "text", title: "❌ 搜索失败", subTitle: e.message }];
    }
}

// 3. 详情解析（获取真实视频流）
async function loadDetail(link) {
    try {
        const res = await request(link);
        const $ = Widget.html.load(res.data);

        let title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || "MissAV";
        let videoUrl = "";

        $('script').each((i, el) => {
            const script = $(el).html() || "";
            // 匹配 surrit 直链
            const surritMatch = script.match(/https:\/\/surrit\.com\/[a-f0-9\-]+\/[^"'\s]*\.m3u8/g);
            if (surritMatch && surritMatch.length) {
                videoUrl = surritMatch[0];
                return false;
            }
            // 匹配 UUID 构造
            const uuidMatch = script.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g);
            if (uuidMatch && uuidMatch.length) {
                videoUrl = `https://surrit.com/${uuidMatch[0]}/playlist.m3u8`;
                return false;
            }
        });

        // 后备正则
        if (!videoUrl) {
            const simpleMatch = res.data.match(/source:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/);
            if (simpleMatch) videoUrl = simpleMatch[1];
        }

        if (videoUrl) {
            return [{
                id: link,
                type: "video",
                title: title,
                videoUrl: videoUrl,
                playerType: "system",
                customHeaders: {
                    "Referer": CONFIG.BASE_URL + "/",
                    "User-Agent": CONFIG.USER_AGENT,
                    "Origin": CONFIG.BASE_URL,
                },
            }];
        } else {
            // 降级：返回网页链接，让播放器用 WebView 打开
            return [{
                id: link,
                type: "link",
                title: title,
                link: link,
                description: "未解析到直链，点击使用浏览器播放",
                playerType: "web",
            }];
        }
    } catch (e) {
        return [{ id: "err", type: "text", title: "❌ 详情加载失败", subTitle: e.message }];
    }
}
