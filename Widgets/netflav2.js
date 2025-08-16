WidgetMetadata = {
  id: "netflav",
  title: "Netflav",
  description: "获取 Netflav 视频",
  author: "flyme",
  site: "https://github.com/quantumultxx/FW-Widgets",
  version: "1.0.9",
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
            { title: "河北彩花", value: "saka-kawakita" },
            { title: "涼森れむ", value: "remu-suzumori" },
            { title: "山手梨愛", value: "ria-yamate" },
            { title: "小宵こなん", value: "konan-koyoi" },
            { title: "石川澪", value: "rio-ishikawa" },
            { title: "八木奈々", value: "nana-yagi" },
            { title: "楪カレン", value: "karen-yuzuriha" },
            { title: "七ツ森りり", value: "riri-nanamori" },
            { title: "美谷朱里", value: "akari-mitani" },
            { title: "架乃ゆら", value: "yura-kano" },
            { title: "小野六花", value: "rikka-ono" }
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
    },
    // 番号模块
    {
      title: "番号",
      description: "按番号系列浏览",
      requiresWebView: false,
      functionName: "loadSeries",
      cacheDuration: 3600,
      params: [
        {
          name: "series",
          title: "选择系列",
          type: "enumeration",
          enumOptions: [
            { title: "SSIS", value: "ssis" },
            { title: "SSNI", value: "ssni" },
            { title: "MIDV", value: "midv" },
            { title: "JUQ", value: "juq" },
            { title: "MIAA", value: "miaa" },
            { title: "ABW", value: "abw" },
            { title: "PRED", value: "pred" },
            { title: "IPX", value: "ipx" },
            { title: "FSDSS", value: "fsdss" },
            { title: "MIDE", value: "mide" }
          ],
          value: "ssis",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    }
  ],
};

// 视频解析API - 关键添加
const VIDEO_API = "https://netflav.com/api/video/";

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

async function loadSeries(params = {}) {
  const series = params.series || "ssis";
  const page = params.page || "1";
  return await loadPage(`https://netflav.com/series/${series}?page=${page}`);
}

async function loadPage(url) {
  try {
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://netflav.com/",
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
    const videoId = link.match(/video\?id=([^&]+)/)?.[1];
    
    if (title && link && cover && videoId) {
      items.push({
        id: videoId, // 使用视频ID作为唯一标识
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

// 关键修复：添加视频API接口调用
async function loadDetail(link) {
  try {
    // 从链接中提取视频ID
    const videoId = link.match(/video\?id=([^&]+)/)?.[1];
    if (!videoId) throw new Error("无效的视频链接");
    
    // 调用视频API获取播放地址
    const apiUrl = `${VIDEO_API}${videoId}`;
    const response = await Widget.http.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://netflav.com/",
      },
    });
    
    const data = JSON.parse(response.data);
    if (!data || !data.src) throw new Error("未找到视频地址");
    
    return {
      id: videoId,
      type: "detail",
      videoUrl: data.src,
      mediaType: "movie",
      customHeaders: {
        "Referer": "https://netflav.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Origin": "https://netflav.com"
      }
    };
  } catch (error) {
    console.error("加载详情出错:", error.message);
    return null;
  }
}
