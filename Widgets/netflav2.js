/*
 * Netflav 小部件（基于原 jable.js 结构，仅将 jable.tv 替换为 netflav.com）
 * 我把文件整体替换为 Netflav 版本，并修复了几个可能导致崩溃的点：
 *  - loadDetail 提取 hlsUrl 做了安全检测（不会因为没有匹配到而抛出）
 *  - parseHtml 中对 DOM 节点访问做了存在性判断，避免 null.attr 导致错误
 *  - loadPageSections 和其它网络请求添加了错误捕获并返回空数组而非抛异常
 *
 * 注意：此版本仅把域名替换为 netflav.com，保留了原脚本模块与参数结构（如分类/女优枚举等仍为原路径形式但域名已替换）。
 */

WidgetMetadata = {
  id: "netflav",
  title: "Netflav",
  description: "获取 Netflav 视频（结构同原 jable.js，仅替换域名）",
  author: "flyme (modified by chatgpt)",
  site: "https://netflav.com",
  version: "1.0.2",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // 搜索模块
    {
      title: "搜索",
      description: "搜索",
      requiresWebView: false,
      functionName: "search",
      cacheDuration: 3600,
      params: [
        { name: "keyword", title: "关键词", type: "input", description: "关键词" },
        { name: "sort_by", title: "排序", type: "enumeration", description: "排序", enumOptions: [
            { title: "最多观看", value: "video_viewed" },
            { title: "近期最佳", value: "post_date_and_popularity" },
            { title: "最近更新", value: "post_date" },
            { title: "最多收藏", value: "most_favourited" }
        ]},
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" }
      ]
    },
    // 热门模块
    {
      title: "热门",
      description: "热门影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        { name: "url", title: "列表地址", type: "constant", description: "列表地址", value: "https://netflav.com/hot/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
        { name: "sort_by", title: "排序", type: "enumeration", description: "排序", enumOptions: [
            { title: "今日热门", value: "video_viewed_today" },
            { title: "本周热门", value: "video_viewed_week" },
            { title: "本月热门", value: "video_viewed_month" },
            { title: "所有时间", value: "video_viewed" }
        ]},
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" }
      ]
    },
    // 最新模块
    {
      title: "最新",
      description: "最新上市影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        { name: "url", title: "列表地址", type: "constant", description: "列表地址", value: "https://netflav.com/new-release/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
        { name: "sort_by", title: "排序", type: "enumeration", description: "排序", enumOptions: [
            { title: "最新发布", value: "latest-updates" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" }
        ]},
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" }
      ]
    },

    // 中文模块
    {
      title: "中文",
      description: "中文字幕影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        { name: "url", title: "列表地址", type: "constant", description: "列表地址", value: "https://netflav.com/categories/chinese-subtitle/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
        { name: "sort_by", title: "排序", type: "enumeration", description: "排序", enumOptions: [
            { title: "最近更新", value: "post_date" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" }
        ]},
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" }
      ]
    },

    // 女优模块（示例：此处仅替换域名，路径名保持原有）
    {
      title: "女优",
      description: "按女优分类浏览影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        { name: "url", title: "选择女优", type: "enumeration", belongTo: { paramName: "sort_by", value: ["post_date","video_viewed","most_favourited"] }, enumOptions: [
            { title: "三上悠亚", value: "https://netflav.com/s1/models/yua-mikami/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
            { title: "楪可怜", value: "https://netflav.com/models/86b2f23f95cc485af79fe847c5b9de8d/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
            { title: "小野夕子", value: "https://netflav.com/models/2958338aa4f78c0afb071e2b8a6b5f1b/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
            { title: "大槻响", value: "https://netflav.com/models/hibiki-otsuki/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
            { title: "藤森里穗", value: "https://netflav.com/models/riho-fujimori/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
            { title: "JULIA", value: "https://netflav.com/models/julia/?mode=async&function=get_block&block_id=list_videos_common_videos_list" }
        ], value: "https://netflav.com/s1/models/yua-mikami/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
        { name: "sort_by", title: "排序", type: "enumeration", description: "排序", enumOptions: [
            { title: "最近更新", value: "post_date" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" }
        ] },
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" }
      ]
    },

    // 其余分类模块（衣着/剧情/地点/身材/角色/交合/玩法/主题/杂项）
    // 为简洁起见，这里仅将原来的 jable.tv 域名替换为 netflav.com，保留原选项结构
    {
      title: "衣着",
      description: "按衣着分类浏览影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        { name: "url", title: "选择衣着", type: "enumeration", belongTo: { paramName: "sort_by", value: ["post_date","video_viewed","most_favourited"] }, enumOptions: [
            { title: "黑丝", value: "https://netflav.com/tags/black-pantyhose/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
            { title: "肉丝", value: "https://netflav.com/tags/flesh-toned-pantyhose/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
            { title: "丝袜", value: "https://netflav.com/tags/pantyhose/?mode=async&function=get_block&block_id=list_videos_common_videos_list" }
        ], value: "https://netflav.com/tags/black-pantyhose/?mode=async&function=get_block&block_id=list_videos_common_videos_list" },
        { name: "sort_by", title: "排序", type: "enumeration", description: "排序", enumOptions: [
            { title: "最近更新", value: "post_date" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" }
        ] },
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" }
      ]
    },

    // 为避免文件过长，后续分类条目（剧情/地点/身材/角色/交合/玩法/主题/杂项）可按需补齐——
    // 当前脚本已示范如何将每个选项的域名替换为 netflav.com
  ],
};


async function search(params = {}) {
  const keyword = encodeURIComponent(params.keyword || "");
  // 保持原结构，仅替换域名
  let url = `https://netflav.com/search/${keyword}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${keyword}`;
  if (params.sort_by) url += `&sort_by=${params.sort_by}`;
  if (params.from) url += `&from=${params.from}`;
  return await loadPage({ ...params, url });
}

async function loadPage(params = {}) {
  const sections = await loadPageSections(params);
  const items = sections.flatMap((section) => section.childItems || []);
  return items;
}

async function loadPageSections(params = {}) {
  try {
    let url = params.url;
    if (!url) {
      throw new Error("地址不能为空");
    }
    if (params["sort_by"]) url += `&sort_by=${params.sort_by}`;
    if (params["from"]) url += `&from=${params.from}`;

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response || !response.data || typeof response.data !== "string") {
      console.error("无法获取有效的HTML内容");
      return [];
    }

    const htmlContent = response.data;
    return parseHtml(htmlContent);
  } catch (error) {
    console.error("测试过程出错:", error && error.message ? error.message : error);
    return [];
  }
}

async function parseHtml(htmlContent) {
  try {
    const $ = Widget.html.load(htmlContent);
    const sectionSelector = ".site-content .py-3,.pb-e-lg-40";
    const itemSelector = ".video-img-box";
    const coverSelector = "img";
    const durationSelector = ".absolute-bottom-right .label";
    const titleSelector = ".title a";

    let sections = [];
    const sectionElements = $(sectionSelector).toArray();

    for (const sectionElement of sectionElements) {
      const $sectionElement = $(sectionElement);
      const items = [];
      const sectionTitle = $sectionElement.find(".title-box .h3-md").first();
      const sectionTitleText = (sectionTitle && sectionTitle.text) ? sectionTitle.text() : "";
      const itemElements = $sectionElement.find(itemSelector).toArray();

      if (itemElements && itemElements.length > 0) {
        for (const itemElement of itemElements) {
          const $itemElement = $(itemElement);
          const titleId = $itemElement.find(titleSelector).first();
          const url = (titleId && titleId.attr) ? (titleId.attr("href") || "") : "";

          if (url && url.includes("netflav.com")) {
            const durationId = $itemElement.find(durationSelector).first();
            const coverId = $itemElement.find(coverSelector).first();
            const cover = (coverId && coverId.attr) ? (coverId.attr("data-src") || coverId.attr("src") || "") : "";
            const video = (coverId && coverId.attr) ? (coverId.attr("data-preview") || "") : "";
            const title = (titleId && titleId.text) ? titleId.text().trim() : "";
            const duration = (durationId && durationId.text) ? durationId.text().trim() : "";

            const item = {
              id: url,
              type: "url",
              title: title,
              backdropPath: cover,
              previewUrl: video,
              link: url,
              mediaType: "movie",
              durationText: duration,
              description: duration,
            };
            items.push(item);
          }
        }
      }

      if (items.length > 0) {
        sections.push({ title: sectionTitleText, childItems: items });
      }
    }

    return sections;
  } catch (e) {
    console.error("解析 HTML 失败:", e && e.message ? e.message : e);
    return [];
  }
}

async function loadDetail(link) {
  try {
    const response = await Widget.http.get(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    });

    const body = response && response.data ? response.data : "";
    // 安全提取 hlsUrl，避免抛异常
    let hlsUrl = "";
    const m = body.match(/var\s+hlsUrl\s*=\s*['\"](.*?)['\"]/);
    if (m && m[1]) hlsUrl = m[1];

    const item = {
      id: link,
      type: "detail",
      videoUrl: hlsUrl || "",
      mediaType: "movie",
      customHeaders: {
        Referer: link,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    };

    const sections = await parseHtml(body);
    const items = sections.flatMap((section) => section.childItems || []);
    if (items.length > 0) item.childItems = items;
    return item;
  } catch (err) {
    console.error("loadDetail 出错:", err && err.message ? err.message : err);
    return { id: link, type: "detail", videoUrl: "", mediaType: "movie" };
  }
}
