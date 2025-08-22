var WidgetMetadata = {
  id: "ti.bemarkt.javrate",
  title: "JAVRate",
  description: "获取 JAVRate 推荐",
  author: "Ti",
  site: "https://www.javrate.com/",
  version: "2.5.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // 艺人模块
    {
      title: "搜索女优",
      description: "搜索女优影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "artistId",
          title: "搜索艺人",
          type: "input",
          placeholders: [
            { title: "大槻响", value: "大槻响" },
            { title: "美園和花", value: "美園和花" },
            { title: "三上悠亜", value: "三上悠亜" }
          ],
          value: "大槻响",
          description: "选择或手动输入女优名称"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },
    // 标签分类模块
    {
      title: "AV 分类",
      description: "按详细分类浏览所有分类的影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "tagType",
          title: "🏷️ 分类",
          type: "enumeration",
          enumOptions: [
            { title: "热门", value: "hot" },
            { title: "颜值", value: "appearance" },
            { title: "类型", value: "genre" }
          ],
          value: "hot",
          description: "选择标签大类"
        },
        {
          name: "tagValue",
          title: "具体类型",
          type: "enumeration",
          belongTo: { paramName: "tagType", value: ["hot"] },
          enumOptions: [
            { title: "美脚・美腿", value: "美脚・美腿" },
            { title: "人妻", value: "人妻" }
          ],
          value: "美脚・美腿",
          description: "选择要浏览的分类"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },
    // 首页分类
    {
      title: "首页分类",
      description: "选择需要浏览的分类",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "categoryType",
          title: "📁 分类类型",
          type: "enumeration",
          enumOptions: [
            { title: "最新发布", value: "/movie/new/" },
            { title: "热门排行", value: "/best/thisweek" }
          ],
          value: "/movie/new/"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },
    // 出品厂商
    {
      title: "出品厂商",
      description: "按出品厂商浏览影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "issuer",
          title: "选择或输入出品厂商",
          type: "input",
          placeholders: [
            { title: "S1", value: "S1" },
            { title: "SOD", value: "SOD" }
          ],
          value: "S1",
          description: "选择或输入出品厂商"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },
    // 番号搜索模块（支持中英文混输）
    {
      title: "番号搜索",
      description: "通过番号搜索影片（支持模糊匹配与中英文混输）",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "code",
          title: "输入番号",
          type: "input",
          placeholders: [
            { title: "IPX-123", value: "IPX-123" },
            { title: "ipx123 番号", value: "ipx123 番号" }
          ],
          value: "",
          description: "输入影片番号（可输入完整或部分，支持中英文混合）"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },
    // 关键字搜索模块（支持中英文混输）
    {
      title: "关键字搜索",
      description: "通过关键字搜索影片（支持模糊匹配与中英文混输）",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "keyword",
          title: "输入关键字",
          type: "input",
          placeholders: [
            { title: "教师", value: "教师" },
            { title: "教师movie", value: "教师movie" }
          ],
          value: "",
          description: "输入要搜索的关键字（可输入中英文混合）"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    }
  ]
};

const ARTIST_MAP_REMOTE_URL = "https://raw.githubusercontent.com/flymec/FW/refs/heads/main/Widgets/javrate_actors.json";
let artistMapCache = null;
let artistMapCacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const BASE_URL = "https://www.javrate.com";

function getCommonHeaders() {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    Referer: BASE_URL
  };
}

function normalizeInput(input) {
  return input
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")
    .replace(/[番号影片电影搜搜索]/g, "")
    .toUpperCase()
    .trim();
}

// ...保留fetchArtistMap、parseDetailPage、parseItems、fetchDataForPath、loadDetail原有逻辑

async function loadPage(params) {
  let path = "";

  if (params?.artistId) {
    // 原艺人处理逻辑
  }
  else if (params && params.tagType && params.tagValue) {
    const encodedTag = encodeURIComponent(params.tagValue);
    path = `/keywords/movie/${encodedTag}`;
  }
  else if (params && params.issuer) {
    const decodedIssuer = decodeURIComponent(params.issuer);
    const encodedIssuer = encodeURIComponent(decodedIssuer);
    path = `/Issuer/${encodedIssuer}`;
  }
  else if (params && params.code) {
    const normalizedCode = normalizeInput(params.code);
    if (!normalizedCode) {
      return [{
        id: "code-invalid",
        type: "url",
        title: "无效番号",
        description: "请输入有效的番号（如 IPX-123 或 ipx123 番号）",
        backdropPath: "",
        link: ""
      }];
    }
    path = `/search/${encodeURIComponent(normalizedCode)}`;
  }
  else if (params && params.keyword) {
    const normalizedKeyword = normalizeInput(params.keyword);
    if (!normalizedKeyword) {
      return [{
        id: "keyword-invalid",
        type: "url",
        title: "无效关键字",
        description: "请输入有效的搜索关键字（可输入中英文混合，如 教师movie）",
        backdropPath: "",
        link: ""
      }];
    }
    path = `/search/${encodeURIComponent(normalizedKeyword)}`;
  }
  else if (params && params.categoryType) {
    path = params.categoryType;
  }
  else {
    return [{
      id: "param-error",
      type: "url",
      title: "参数配置错误",
      description: "缺少必要参数，请检查模块配置。",
      backdropPath: "",
      link: ""
    }];
  }

  return fetchDataForPath(path, params);
}
