// ==========================
// Netflav Pro 适配脚本
// ==========================
// 基于 Netflav 网站的 __NEXT_DATA__ 数据解析
// 支持搜索、热门、分类、女优等浏览
// 视频播放地址从详情页的 __NEXT_DATA__ 中提取
// ==========================

WidgetMetadata = {
  id: "netflav",
  title: "Netflav Pro",
  description: "Netflav 视频获取器（基于 Next.js 数据）",
  author: "flyme",
  site: "https://github.com/quantumultxx/FW-Widgets",
  version: "1.3.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // 搜索模块
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
    // 热门模块（首页“推薦給你”）
    {
      title: "热门",
      description: "热门推荐影片",
      requiresWebView: false,
      functionName: "loadHot",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 有码影片
    {
      title: "有码影片",
      description: "有码分类",
      requiresWebView: false,
      functionName: "loadCensored",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 无码影片
    {
      title: "无码影片",
      description: "无码分类",
      requiresWebView: false,
      functionName: "loadUncensored",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 中文字幕
    {
      title: "中文字幕",
      description: "中文字幕影片",
      requiresWebView: false,
      functionName: "loadChinese",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 女优浏览
    {
      title: "女优",
      description: "按女优浏览",
      requiresWebView: false,
      functionName: "loadActress",
      cacheDuration: 3600,
      params: [
        {
          name: "actress",
          title: "选择女优",
          type: "enumeration",
          enumOptions: [
            { title: "三上悠亜", value: "三上悠亜" },
            { title: "桃乃木かな", value: "桃乃木かな" },
            { title: "橋本ありな", value: "橋本ありな" },
            { title: "深田えいみ", value: "深田えいみ" },
            { title: "葵つかさ", value: "葵つかさ" },
            { title: "相沢みなみ", value: "相沢みなみ" },
            { title: "高橋しょう子", value: "高橋しょう子" },
            { title: "桜空もも", value: "桜空もも" },
            { title: "天使もえ", value: "天使もえ" },
            { title: "河北彩花", value: "河北彩花" },
            { title: "涼森れむ", value: "涼森れむ" },
            { title: "山手梨愛", value: "山手梨愛" },
            { title: "小宵こなん", value: "小宵こなん" },
            { title: "石川澪", value: "石川澪" },
            { title: "八木奈々", value: "八木奈々" },
            { title: "楪カレン", value: "楪カレン" },
            { title: "七ツ森りり", value: "七ツ森りり" },
            { title: "美谷朱里", value: "美谷朱里" },
            { title: "架乃ゆら", value: "架乃ゆら" },
            { title: "小野六花", value: "小野六花" }
          ],
          value: "三上悠亜",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // 类别浏览
    {
      title: "类别",
      description: "按类别浏览",
      requiresWebView: false,
      functionName: "loadGenre",
      cacheDuration: 3600,
      params: [
        {
          name: "genre",
          title: "选择类别",
          type: "enumeration",
          enumOptions: [
            { title: "有碼", value: "有碼" },
            { title: "無碼", value: "無碼" },
            { title: "中文字幕", value: "中文字幕" },
            { title: "巨乳", value: "巨乳" },
            { title: "美少女", value: "美少女" },
            { title: "單體作品", value: "單體作品" },
            { title: "中出", value: "中出" },
            { title: "潮吹", value: "潮吹" }
          ],
          value: "有碼",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    }
  ],
};

// ==================== 全局配置 ====================
const BASE_URL = "https://netflav.com";

// ==================== 辅助函数 ====================
// 从HTML中提取 __NEXT_DATA__ JSON
function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) {
    console.error("未找到 __NEXT_DATA__");
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    console.error("解析 __NEXT_DATA__ 失败:", e);
    return null;
  }
}

// 根据页面类型从 initialState 中提取视频列表
function extractVideosFromState(initialState, pageType) {
  // 尝试各种可能的数据路径
  const possiblePaths = [
    "censored.docs",
    "uncensored.docs",
    "chinese.docs",
    "trending.docs",
    "search.docs",
    "all.docs",
    "actress.docs",
    "video.related",
  ];
  for (const path of possiblePaths) {
    const parts = path.split('.');
    let obj = initialState;
    let valid = true;
    for (const part of parts) {
      if (obj && obj.hasOwnProperty(part)) {
        obj = obj[part];
      } else {
        valid = false;
        break;
      }
    }
    if (valid && Array.isArray(obj)) {
      return obj;
    }
  }
  return null;
}

// 从视频对象构建标准项
function buildItemFromVideo(video) {
  if (!video || !video.videoId) return null;
  return {
    id: video.videoId,
    type: "url",
    title: video.title_zh || video.title || "无标题",
    backdropPath: video.preview || video.preview_hp || "",
    link: `${BASE_URL}/video?id=${video.videoId}`,
    mediaType: "movie",
    description: video.description || "",
    durationText: video.sourceDate ? new Date(video.sourceDate).toLocaleDateString() : "",
  };
}

// 加载页面并解析视频列表
async function loadPage(url, pageTypeHint = null) {
  try {
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36",
        "Referer": BASE_URL + "/",
      },
      redirect: "follow"
    });
    if (!response.data) return [];

    const nextData = extractNextData(response.data);
    if (!nextData || !nextData.props || !nextData.props.initialState) return [];

    const initialState = nextData.props.initialState;
    // 尝试根据当前URL猜测数据类型
    let videos = null;
    if (url.includes("/censored")) videos = initialState.censored?.docs;
    else if (url.includes("/uncensored")) videos = initialState.uncensored?.docs;
    else if (url.includes("/chinese-sub")) videos = initialState.chinese?.docs;
    else if (url.includes("/trending")) videos = initialState.trending?.docs;
    else if (url.includes("/search")) videos = initialState.search?.docs;
    else if (url.includes("/all")) videos = initialState.all?.docs;
    else if (url.includes("/actress")) videos = initialState.actress?.docs;
    else {
      // 通用回退
      videos = extractVideosFromState(initialState);
    }

    if (!videos || !Array.isArray(videos)) return [];

    return videos.map(buildItemFromVideo).filter(item => item !== null);
  } catch (error) {
    console.error("加载页面出错:", error.message);
    return [];
  }
}

// ==================== 模块导出函数 ====================

async function search(params = {}) {
  const keyword = encodeURIComponent(params.keyword || "");
  const page = params.page || "1";
  const url = `${BASE_URL}/search?keyword=${keyword}&page=${page}`;
  return await loadPage(url);
}

async function loadHot(params = {}) {
  const page = params.page || "1";
  return await loadPage(`${BASE_URL}/trending?page=${page}`);
}

async function loadCensored(params = {}) {
  const page = params.page || "1";
  return await loadPage(`${BASE_URL}/censored?page=${page}`);
}

async function loadUncensored(params = {}) {
  const page = params.page || "1";
  return await loadPage(`${BASE_URL}/uncensored?page=${page}`);
}

async function loadChinese(params = {}) {
  const page = params.page || "1";
  return await loadPage(`${BASE_URL}/chinese-sub?page=${page}`);
}

async function loadActress(params = {}) {
  const actress = encodeURIComponent(params.actress || "三上悠亜");
  const page = params.page || "1";
  const url = `${BASE_URL}/all?actress=${actress}&page=${page}`;
  return await loadPage(url);
}

async function loadGenre(params = {}) {
  const genre = encodeURIComponent(params.genre || "有碼");
  const page = params.page || "1";
  const url = `${BASE_URL}/all?genre=${genre}&page=${page}`;
  return await loadPage(url);
}

// 视频详情加载（播放地址）
async function loadDetail(link) {
  try {
    // 从链接中提取视频ID
    const videoId = new URLSearchParams(link.split('?')[1]).get('id');
    if (!videoId) return null;

    const url = `${BASE_URL}/video?id=${videoId}`;
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36",
        "Referer": BASE_URL + "/",
      },
      redirect: "follow"
    });
    if (!response.data) return null;

    const nextData = extractNextData(response.data);
    if (!nextData || !nextData.props || !nextData.props.initialState) return null;

    const initialState = nextData.props.initialState;
    // 视频详情通常存储在 initialState.video 中
    const videoDetail = initialState.video;
    if (!videoDetail) return null;

    // 获取视频播放地址（可能位于 videoDetail.videoUrl 或 videoDetail.src）
    let videoUrl = videoDetail.videoUrl || videoDetail.src;
    if (!videoUrl) {
      // 尝试从 related 中找第一个视频的 src
      if (videoDetail.related && videoDetail.related.length > 0) {
        videoUrl = videoDetail.related[0].videoUrl || videoDetail.related[0].src;
      }
    }
    if (!videoUrl) return null;

    return {
      id: videoId,
      type: "detail",
      videoUrl: videoUrl,
      mediaType: "movie",
      customHeaders: {
        "Referer": BASE_URL + "/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36",
        "Origin": BASE_URL,
      }
    };
  } catch (error) {
    console.error("加载详情出错:", error.message);
    return null;
  }
}

// 导出所有函数
export default {
  metadata: WidgetMetadata,
  search,
  loadHot,
  loadCensored,
  loadUncensored,
  loadChinese,
  loadActress,
  loadGenre,
  loadDetail,
};
