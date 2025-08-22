var WidgetMetadata = {
  id: "ti.bemarkt.javrate",
  title: "JAVRate",
  description: "获取 JAVRate 推荐",
  author: "Ti",
  site: "https://www.javrate.com/",
  version: "2.2.0",
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
            { title: "三上悠亜", value: "三上悠亜" },
            { title: "波多野结衣", value: "波多野结衣" }
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
          value: "hot"
        },
        {
          name: "tagValue",
          title: "具体标签",
          type: "input",
          value: "美脚・美腿"
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
            { title: "热门排行", value: "/best/thisweek" },
            { title: "无码A片", value: "/menu/uncensored/5-2-" },
            { title: "日本A片", value: "/menu/censored/5-2-" },
            { title: "国产AV", value: "/menu/chinese/5-2-" }
          ],
          value: "/movie/new/"
        },
        {
          name: "sort_by",
          title: "时间范围",
          type: "enumeration",
          belongTo: {
            paramName: "categoryType",
            value: ["/best/thisweek"],
          },
          enumOptions: [
            { title: "最近一周", value: "/best/thisweek" },
            { title: "最近一月", value: "/best/thismonth" },
            { title: "最近半年", value: "/best/thishalfyear" },
            { title: "最近一年", value: "/best/thisyear" },
            { title: "全部时间", value: "/best" }
          ],
          value: "/best/thisweek"
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
            { title: "SOD", value: "SOD" },
            { title: "麻豆传媒", value: "麻豆傳媒" }
          ],
          value: "S1"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },

    // ✅ 新增：番号搜索
    {
      title: "番号搜索",
      description: "通过番号搜索影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "movieNumber",
          title: "输入番号",
          type: "input",
          placeholders: [
            { title: "ABP-123", value: "ABP-123" },
            { title: "SSNI-456", value: "SSNI-456" }
          ],
          value: ""
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },

    // ✅ 新增：关键字搜索
    {
      title: "关键字搜索",
      description: "通过关键字搜索影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        {
          name: "keyword",
          title: "输入关键字",
          type: "input",
          placeholders: [
            { title: "学生制服", value: "学生制服" },
            { title: "人妻NTR", value: "人妻NTR" }
          ],
          value: ""
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

// ...（fetchArtistMap、normalizeArtistName、parseDetailPage、parseItems、fetchDataForPath、loadDetail 保持原样）

async function loadPage(params) {
  let path = "";

  if (params?.artistId) {
    try {
      const artistMap = await fetchArtistMap();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.artistId);
      if (!isUUID) {
        const normalizedInput = await normalizeArtistName(params.artistId);
        let matchedId = null;
        let matchScore = 0;

        for (const [name, id] of Object.entries(artistMap)) {
          const normalizedMapName = await normalizeArtistName(name);
          if (normalizedMapName === normalizedInput) {
            matchedId = id;
            matchScore = 100;
            break;
          }
          if (normalizedMapName.includes(normalizedInput)) {
            const score = normalizedInput.length * 10;
            if (score > matchScore) {
              matchScore = score;
              matchedId = id;
            }
          }
        }

        if (!matchedId) {
          return [{
            id: "artist-not-found",
            type: "url",
            title: "艺人未找到",
            description: `未找到艺人: ${params.artistId}`,
            backdropPath: "",
            link: ""
          }];
        }

        params.artistId = matchedId;
      }
      path = `/actor/movie/${params.artistId}.html`;
    } catch (error) {
      return [{
        id: "artist-map-error",
        type: "url",
        title: "艺人列表加载失败",
        description: "错误: " + error.message,
        backdropPath: "",
        link: ""
      }];
    }
  }

  else if (params && params.tagType && params.tagValue) {
    const encodedTag = encodeURIComponent(params.tagValue);
    path = `/keywords/movie/${encodedTag}`;
  }

  else if (params && params.issuer) {
    const encodedIssuer = encodeURIComponent(params.issuer);
    path = `/Issuer/${encodedIssuer}`;
  }

  // ✅ 番号搜索
  else if (params && params.movieNumber) {
    const encodedNumber = encodeURIComponent(params.movieNumber.trim());
    path = `/search/${encodedNumber}`;
  }

  // ✅ 关键字搜索
  else if (params && params.keyword) {
    const encodedKeyword = encodeURIComponent(params.keyword.trim());
    path = `/search/${encodedKeyword}`;
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
