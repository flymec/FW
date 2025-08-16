WidgetMetadata = {
  id: "netflav",
  title: "Netflav",
  description: "获取 Netflav 视频",
  author: "flyme",
  site: "https://github.com/quantumultxx/FW-Widgets",
  version: "1.0.8",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // 搜索模块（支持番号搜索）
    {
      title: "搜索",
      description: "关键词或番号搜索",
      requiresWebView: false,
      functionName: "search",
      cacheDuration: 3600,
      params: [
        {
          name: "keyword",
          title: "关键词/番号",
          type: "input",
          description: "输入关键词或番号",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 女优模块
    {
      title: "女优",
      description: "按女优分类浏览",
      requiresWebView: false,
      functionName: "loadActress",
      cacheDuration: 3600,
      params: [
        {
          name: "actress",
          title: "选择女优",
          type: "enumeration",
          enumOptions: [
            { title: "三上悠亜", value: "yua-mikami" },
            { title: "桃乃木かな", value: "kana-momonogi" },
            { title: "橋本ありな", value: "arina-hashimoto" },
            { title: "深田えいみ", value: "eimi-fukada" },
            { title: "葵つかさ", value: "tsukasa-aoi" },
            { title: "相沢みなみ", value: "minami-aizawa" },
            { title: "高橋しょう子", value: "shouko-takahashi" },
            { title: "桜空もも", value: "momo-sakura" },
            { title: "天使もえ", value: "moe-amatsuka" },
            { title: "河北彩花", value: "saka-kawakita" }
          ],
          value: "yua-mikami",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 最热模块
    {
      title: "最热",
      description: "热门影片",
      requiresWebView: false,
      functionName: "loadHot",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 最新模块
    {
      title: "最新",
      description: "最新上市影片",
      requiresWebView: false,
      functionName: "loadNew",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    }
  ],
};

async function search(params = {}) {
  const keyword = encodeURIComponent(params.keyword || "");
  const page = params.page || "1";
  const url = `https://netflav.com/search?keyword=${keyword}&page=${page}`;
  return await loadPage(url);
}

async function loadActress(params = {}) {
  const actress = params.actress || "yua-mikami";
  const page = params.page || "1";
  const url = `https://netflav.com/model/${actress}?page=${page}`;
  return await loadPage(url);
}

async function loadHot(params = {}) {
  const page = params.page || "1";
  return await loadPage(`https://netflav.com/popular?page=${page}`);
}

async function loadNew(params = {}) {
  const page = params.page || "1";
  return await loadPage(`https://netflav.com/new?page=${page}`);
}

async function loadPage(url) {
  try {
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.data) throw new Error("无有效数据");
    
    return parseHtml(response.data);
  } catch (error) {
    console.error("加载页面出错:", error.message);
    return [];
  }
}

async function parseHtml(htmlContent) {
  const $ = Widget.html.load(htmlContent);
  const items = [];
  
  $('.grid-item').each((index, element) => {
    const $el = $(element);
    const title = $el.find('.video-title').text().trim();
    const link = $el.find('a').attr('href');
    const cover = $el.find('img').attr('src');
    const duration = $el.find('.duration').text().trim();
    
    if (title && link && cover) {
      items.push({
        id: link,
        type: "url",
        title: title,
        backdropPath: cover,
        link: link,
        mediaType: "movie",
        durationText: duration,
        description: duration
      });
    }
  });
  
  return items;
}

async function loadDetail(link) {
  try {
    const response = await Widget.http.get(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    
    const $ = Widget.html.load(response.data);
    const videoUrl = $('video source').attr('src');
    
    if (!videoUrl) throw new Error("未找到视频地址");
    
    return {
      id: link,
      type: "detail",
      videoUrl: videoUrl,
      mediaType: "movie",
      customHeaders: {
        "Referer": "https://netflav.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      }
    };
  } catch (error) {
    console.error("加载详情出错:", error.message);
    return null;
  }
}
