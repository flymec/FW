/*
 * AV Aggregator Widget (Jable + Netflav)
 * 在一个文件中同时支持 Jable 与 Netflav：搜索、番号、女优、最热视频
 * 保留原 jable.js 结构，新增 Netflav 模块与解析器，并在 loadPage 内根据 URL 自动切换
 *
 * 注意：Netflav 的页面结构可能随时间变化，若解析不到，请在 parseHtmlNetflav 中调整选择器。
 */

WidgetMetadata = {
  id: "av_aggregator",
  title: "Jable + Netflav",
  description: "获取 Jable 与 Netflav 视频",
  author: "flyme + chatgpt",
  site: "https://jable.tv, https://netflav.com",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // ========================= JABLE =========================
    // 搜索模块（Jable）
    {
      title: "Jable · 搜索",
      description: "搜索 Jable",
      requiresWebView: false,
      functionName: "searchJable",
      cacheDuration: 3600,
      params: [
        { name: "keyword", title: "关键词/番号/女优", type: "input", description: "关键词" },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          enumOptions: [
            { title: "最多观看", value: "video_viewed" },
            { title: "近期最佳", value: "post_date_and_popularity" },
            { title: "最近更新", value: "post_date" },
            { title: "最多收藏", value: "most_favourited" },
          ],
        },
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 热门模块（Jable）
    {
      title: "Jable · 热门",
      description: "热门影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "列表地址",
          type: "constant",
          description: "列表地址",
          value:
            "https://jable.tv/hot/?mode=async&function=get_block&block_id=list_videos_common_videos_list",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          enumOptions: [
            { title: "今日热门", value: "video_viewed_today" },
            { title: "本周热门", value: "video_viewed_week" },
            { title: "本月热门", value: "video_viewed_month" },
            { title: "所有时间", value: "video_viewed" },
          ],
        },
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 最新模块（Jable）
    {
      title: "Jable · 最新",
      description: "最新上市影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "列表地址",
          type: "constant",
          description: "列表地址",
          value:
            "https://jable.tv/new-release/?mode=async&function=get_block&block_id=list_videos_common_videos_list",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          enumOptions: [
            { title: "最新发布", value: "latest-updates" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" },
          ],
        },
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 中文模块（Jable）
    {
      title: "Jable · 中文",
      description: "中文字幕影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "列表地址",
          type: "constant",
          description: "列表地址",
          value:
            "https://jable.tv/categories/chinese-subtitle/?mode=async&function=get_block&block_id=list_videos_common_videos_list",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          description: "排序",
          enumOptions: [
            { title: "最近更新", value: "post_date" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" },
          ],
        },
        { name: "from", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },

    // ========================= NETFLAV =========================
    // 搜索模块（Netflav）
    {
      title: "Netflav · 搜索",
      description: "搜索 Netflav（关键词/番号/女优名）",
      requiresWebView: false,
      functionName: "searchNetflav",
      cacheDuration: 3600,
      params: [
        { name: "keyword", title: "关键词/番号/女优", type: "input", description: "关键词" },
        {
          name: "sort",
          title: "排序",
          type: "enumeration",
          description: "排序（若站点支持）",
          enumOptions: [
            { title: "相关度", value: "relevance" },
            { title: "最新", value: "latest" },
            { title: "最热", value: "popular" },
          ],
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 番号模块（Netflav）——实质同搜索，但强调输入番号
    {
      title: "Netflav · 番号",
      description: "按番号搜索 Netflav（如 ABP-123）",
      requiresWebView: false,
      functionName: "searchNetflav",
      cacheDuration: 3600,
      params: [
        { name: "keyword", title: "番号", type: "input", description: "输入番号，如 ABP-123" },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 女优模块（Netflav）——提供输入框，或直接粘贴演员页 URL
    {
      title: "Netflav · 女优",
      description: "按女优名搜索，或直接粘贴演员页 URL",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "演员页或搜索关键字",
          type: "input",
          description:
            "可直接填演员页 URL（如 https://netflav.com/actress/xxxx），或仅填名字（将自动走搜索）",
          value: "",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
        {
          name: "sort",
          title: "排序",
          type: "enumeration",
          description: "排序（若站点支持）",
          enumOptions: [
            { title: "相关度", value: "relevance" },
            { title: "最新", value: "latest" },
            { title: "最热", value: "popular" },
          ],
        },
      ],
    },
    // 最热视频（Netflav）
    {
      title: "Netflav · 最热视频",
      description: "站内热门/趋势影片列表",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "url",
          title: "热门列表地址",
          type: "constant",
          description: "若失效可改为 netflav 的热门/趋势页",
          value: "https://netflav.com/search?sort=popular",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
  ],
};

// ========================= 公共入口 =========================

async function searchJable(params = {}) {
  const keyword = encodeURIComponent(params.keyword || "");
  let url = `https://jable.tv/search/${keyword}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${keyword}`;
  if (params.sort_by) url += `&sort_by=${params.sort_by}`;
  if (params.from) url += `&from=${params.from}`;
  return await loadPage({ ...params, url });
}

async function searchNetflav(params = {}) {
  const keyword = encodeURIComponent(params.keyword || "");
  const page = encodeURIComponent(params.page || "1");
  const sort = encodeURIComponent(params.sort || "relevance");
  // 通用搜索 URL。若站点后续改版，可在这里调整。
  let url = `https://netflav.com/search?keyword=${keyword}&page=${page}&sort=${sort}`;
  return await loadPage({ ...params, url });
}

async function loadPage(params = {}) {
  const sections = await loadPageSections(params);
  const items = sections.flatMap((s) => s.childItems);
  return items;
}

async function loadPageSections(params = {}) {
  try {
    let { url } = params;
    if (!url) throw new Error("地址不能为空");

    // 将 Netflav · 女优模块中的“仅填名字”转换为搜索 URL
    if (url && !/^https?:\/\//.test(url)) {
      const keyword = encodeURIComponent(url);
      const page = encodeURIComponent(params.page || "1");
      const sort = encodeURIComponent(params.sort || "relevance");
      url = `https://netflav.com/search?keyword=${keyword}&page=${page}&sort=${sort}`;
    }

    // 附加 Jable 的分页/排序参数
    if (url.includes("jable.tv")) {
      if (params["sort_by"]) url += `&sort_by=${params.sort_by}`;
      if (params["from"]) url += `&from=${params.from}`;
    }

    // 附加 Netflav 的分页/排序参数（若已经在 URL 中可忽略）
    if (url.includes("netflav.com")) {
      const usp = new URL(url);
      if (params["page"]) usp.searchParams.set("page", params.page);
      if (params["sort"]) usp.searchParams.set("sort", params.sort);
      url = usp.toString();
    }

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response || !response.data || typeof response.data !== "string") {
      throw new Error("无法获取有效的HTML内容");
    }

    const htmlContent = response.data;

    // 按站点选择解析器
    if (url.includes("jable.tv")) {
      return parseHtmlJable(htmlContent);
    } else if (url.includes("netflav.com")) {
      return parseHtmlNetflav(htmlContent);
    } else {
      throw new Error("不支持的站点");
    }
  } catch (error) {
    console.error("请求出错:", error.message);
    throw error;
  }
}

// ========================= Jable 解析（原版） =========================

async function parseHtmlJable(htmlContent) {
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
    const sectionTitleText = sectionTitle.text();
    const itemElements = $sectionElement.find(itemSelector).toArray();

    if (itemElements && itemElements.length > 0) {
      for (const itemElement of itemElements) {
        const $item = $(itemElement);
        const titleId = $item.find(titleSelector).first();
        const url = titleId.attr("href") || "";
        if (url && url.includes("jable.tv")) {
          const durationId = $item.find(durationSelector).first();
          const coverId = $item.find(coverSelector).first();
          const cover = coverId.attr("data-src") || coverId.attr("src") || "";
          const video = coverId.attr("data-preview") || "";
          const title = titleId.text().trim();
          const duration = (durationId.text() || "").trim();

          items.push({
            id: url,
            type: "url",
            title,
            backdropPath: cover,
            previewUrl: video,
            link: url,
            mediaType: "movie",
            durationText: duration,
            description: duration,
          });
        }
      }
    }

    if (items.length > 0) {
      sections.push({ title: sectionTitleText, childItems: items });
    }
  }

  return sections;
}

// ========================= Netflav 解析 =========================

async function parseHtmlNetflav(htmlContent) {
  const $ = Widget.html.load(htmlContent);

  // 常见卡片容器尝试：适配不同布局（尽量宽松）
  const sectionSelectorCandidates = [
    "main", // 通用 main 区域
    ".container", // 常见容器
    ".content",
    "body",
  ];

  const itemSelectorCandidates = [
    "a[href*='netflav.com/video/']", // 明确的视频链接
    ".card a[href]",
    ".grid a[href]",
    "article a[href]",
  ];

  const durationSelectorCandidates = [
    ".duration", ".card__duration", ".time", "time", "span:contains(':')",
  ];

  const titleSelectorCandidates = [
    "img[alt]", "h3", ".title", ".card__title", "figcaption", "p",
  ];

  const coverSelectorCandidates = [
    "img[data-src]", "img[data-original]", "img[data-thumb]", "img",
  ];

  // 仅创建一个 section，把页面里解析到的卡片都塞进去
  const items = [];

  // 找到一个可用的容器
  let $root = null;
  for (const sel of sectionSelectorCandidates) {
    const cand = $(sel);
    if (cand && cand.length) { $root = cand; break; }
  }
  if (!$root) $root = $("body");

  // 遍历可能的卡片选择器
  const seen = new Set();
  for (const itemSel of itemSelectorCandidates) {
    $root.find(itemSel).each((_, el) => {
      const $a = $(el);
      const href = ($a.attr("href") || "").trim();
      if (!href) return;
      const url = href.startsWith("http") ? href : `https://netflav.com${href.startsWith("/") ? href : "/" + href}`;
      if (!url.includes("netflav.com/video/")) return; // 过滤非视频页
      if (seen.has(url)) return;

      // 标题
      let title = "";
      for (const tSel of titleSelectorCandidates) {
        const tEl = $a.find(tSel).first();
        if (tEl && tEl.length) { title = (tEl.attr("alt") || tEl.text() || "").trim(); if (title) break; }
      }
      if (!title) title = ($a.attr("title") || "").trim();

      // 封面
      let cover = "";
      for (const cSel of coverSelectorCandidates) {
        const img = $a.find(cSel).first();
        if (img && img.length) {
          cover = img.attr("data-src") || img.attr("data-original") || img.attr("data-thumb") || img.attr("src") || "";
          if (cover) break;
        }
      }

      // 时长
      let duration = "";
      for (const dSel of durationSelectorCandidates) {
        const dEl = $a.find(dSel).first();
        if (dEl && dEl.length) { duration = (dEl.text() || "").trim(); if (duration) break; }
      }

      items.push({
        id: url,
        type: "url",
        title: title || url,
        backdropPath: cover,
        previewUrl: "",
        link: url,
        mediaType: "movie",
        durationText: duration,
        description: duration,
      });
      seen.add(url);
    });
  }

  // 兜底：如果一个都没抓到，尝试解析常见 figure 结构
  if (items.length === 0) {
    $("figure a[href*='netflav.com/video/']").each((_, el) => {
      const $a = $(el);
      const href = $a.attr("href") || "";
      if (!href) return;
      const url = href.startsWith("http") ? href : `https://netflav.com${href.startsWith("/") ? href : "/" + href}`;
      const img = $a.find("img").first();
      const cover = img.attr("data-src") || img.attr("src") || "";
      const title = img.attr("alt") || ($a.attr("title") || "").trim();
      items.push({ id: url, type: "url", title: title || url, backdropPath: cover, link: url, mediaType: "movie" });
    });
  }

  const sections = [];
  if (items.length > 0) {
    sections.push({ title: "Netflav 列表", childItems: items });
  }
  return sections;
}

// ========================= 详情 =========================

async function loadDetail(link) {
  // 按站点分别处理
  if (link.includes("jable.tv")) {
    const response = await Widget.http.get(link, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
    });
    const hlsMatch = response.data.match(/var hlsUrl = '(.*?)';/);
    const hlsUrl = hlsMatch && hlsMatch[1];
    const item = {
      id: link,
      type: "detail",
      videoUrl: hlsUrl || "",
      mediaType: "movie",
      customHeaders: {
        Referer: link,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    };
    const sections = await parseHtmlJable(response.data);
    const items = sections.flatMap((s) => s.childItems);
    if (items.length > 0) item.childItems = items;
    return item;
  }

  if (link.includes("netflav.com")) {
    // Netflav 通常不会直接暴露可播放 hls；这里先返回详情页与推荐列表，播放链接如果有可在此处补充解析。
    const response = await Widget.http.get(link, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
    });
    const sections = await parseHtmlNetflav(response.data);
    const items = sections.flatMap((s) => s.childItems);
    return {
      id: link,
      type: "detail",
      videoUrl: "", // 如需播放地址，可在此实现解析
      mediaType: "movie",
      link,
      childItems: items,
    };
  }

  throw new Error("未知站点详情页");
}
