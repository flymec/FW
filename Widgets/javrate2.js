var WidgetMetadata = {
  id: "ti.bemarkt.javrate",
  title: "JAVRate",
  description: "获取 JAVRate 推荐",
  author: "Ti",
  site: "https://www.javrate.com/",
  version: "2.2.0", // 更新版本号
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // 新增：关键词搜索模块
    {
      title: "关键词搜索",
      description: "通过关键词搜索影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 1800, // 搜索结果缓存时间较短
      params: [
        {
          name: "keyword",
          title: "搜索关键词",
          type: "input",
          placeholders: [
            { title: "人妻", value: "人妻" },
            { title: "痴女", value: "痴女" },
            { title: "巨乳", value: "巨乳" },
            { title: "美少女", value: "美少女" },
            { title: "寝取", value: "寝取" },
            { title: "制服", value: "制服" },
            { title: "オナニー", value: "オナニー" }
          ],
          value: "",
          description: "输入要搜索的关键词"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },
    // 新增：番号搜索模块
    {
      title: "番号搜索",
      description: "通过番号搜索影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 1800,
      params: [
        {
          name: "code",
          title: "影片番号",
          type: "input",
          placeholders: [
            { title: "SSIS-001", value: "SSIS-001" },
            { title: "ABP-001", value: "ABP-001" },
            { title: "IPX-177", value: "IPX-177" },
            { title: "MIDV-013", value: "MIDV-013" },
            { title: "JUFE-088", value: "JUFE-088" }
          ],
          value: "",
          description: "输入影片番号，如SSIS-001"
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    },
    // 原有的艺人模块
    {
      title: "搜索女优",
      description: "搜索女优影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        // ... 原有参数保持不变
      ]
    },
    // 原有的标签分类模块
    {
      title: "AV 分类",
      description: "按详细分类浏览所有分类的影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        // ... 原有参数保持不变
      ]
    },
    // 原有的首页分类
    {
      title: "首页分类",
      description: "选择需要浏览的分类",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        // ... 原有参数保持不变
      ]
    },
    // 原有的出品厂商
    {
      title: "出品厂商",
      description: "按出品厂商浏览影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 3600,
      params: [
        // ... 原有参数保持不变
      ]
    }
  ]
};

// ... 原有的常量定义保持不变

// 修改 fetchDataForPath 函数以支持搜索功能
async function fetchDataForPath(path, params = {}) {
  const page = parseInt(params.page, 10) || 1;
  let requestUrl = "";

  // 处理关键词搜索
  if (params.keyword) {
    const encodedKeyword = encodeURIComponent(params.keyword);
    requestUrl = page > 1 
      ? `${BASE_URL}/search?q=${encodedKeyword}&page=${page}`
      : `${BASE_URL}/search?q=${encodedKeyword}`;
  }
  // 处理番号搜索
  else if (params.code) {
    const encodedCode = encodeURIComponent(params.code);
    requestUrl = page > 1 
      ? `${BASE_URL}/search?q=${encodedCode}&page=${page}`
      : `${BASE_URL}/search?q=${encodedCode}`;
  }
  // 原有的路径处理逻辑
  else if (!path || !path.startsWith("/")) {
    path = "/" + (path || "");
  }

  if (path.includes("/actor/movie/") && path.endsWith(".html")) {
    const artistId = path.match(/\/actor\/movie\/([^\/]+)\.html$/)?.[1];
    if (!artistId) {
      return [{
        id: "artist-id-error", 
        type: "url", 
        title: "艺人识别错误", 
        description: `无法从URL识别艺人ID: ${path}`, 
        backdropPath: "", 
        link: path 
      }];
    }
    requestUrl = page > 1 
      ? `${BASE_URL}/actor/movie/1-0-2-${page}/${artistId}.html`
      : `${BASE_URL}${path}`;
  }
  else if (path.startsWith("/keywords/movie/")) {
    requestUrl = page > 1 
      ? `${BASE_URL}${path}?page=${page}&sort=5`
      : `${BASE_URL}${path}`;
  }
  else if (path.startsWith("/Issuer/")) {
    requestUrl = page > 1 
      ? `${BASE_URL}${path}?page=${page}&sort=5`
      : `${BASE_URL}${path}`;
  }
  else if (path.startsWith("/best/")) { 
    const sortByPath = params.sort_by || path; 
    requestUrl = page > 1 
      ? `${BASE_URL}${sortByPath}?page=${page}` 
      : `${BASE_URL}${sortByPath}`;
  }
  else if ([
    "/menu/uncensored/5-2-", 
    "/menu/censored/5-2-", 
    "/menu/chinese/5-2-"
  ].includes(path)) {
    requestUrl = `${BASE_URL}${path}${page}`;
  }
  else if (path === "/movie/new/") {
    requestUrl = `${BASE_URL}${path}`;
  }
  else if (!requestUrl) { // 只有当requestUrl尚未设置时才处理
    const trimmedPath = path.endsWith("/") ? path.slice(0, -1) : path;
    requestUrl = page > 1 
      ? `${BASE_URL}${trimmedPath}/${page}.html`
      : `${BASE_URL}${trimmedPath}`;
  }

  try {
    const response = await Widget.http.get(requestUrl, {
      headers: getCommonHeaders(),
    });
    
    if (!response?.data) {
      return [{
        id: `${requestUrl}-error`,
        type: "url",
        title: "加载失败",
        description: `服务器未返回有效数据: ${requestUrl}`,
        backdropPath: "",
        link: requestUrl
      }];
    }
    
    // 检查搜索结果页面是否为空
    if (response.data.includes("抱歉，没有找到") || 
        response.data.includes("没有找到相关影片") ||
        response.data.includes("検索結果が見つかりません")) {
      return [{
        id: `${requestUrl}-no-content`,
        type: "url",
        title: "未找到影片",
        description: "没有找到符合条件的影片，请尝试其他关键词或番号",
        backdropPath: "",
        link: requestUrl
      }];
    }

    const $ = Widget.html.load(response.data);
    const items = await parseItems(BASE_URL, $, requestUrl);
    
    if (items.length === 0) {
      return [{
        id: `${requestUrl}-empty`,
        type: "url",
        title: "无匹配影片",
        description: "未找到任何影片，可能是内容已变更",
        backdropPath: "",
        link: requestUrl
      }];
    }
    
    return items;
  } catch (error) {
    console.error(`请求失败: ${requestUrl} - ${error.message}`);
    return [{
      id: `${requestUrl}-error`,
      type: "url",
      title: `加载失败: 第${page}页`,
      description: `请求出错: ${error.message}`,
      backdropPath: "",
      link: requestUrl
    }];
  }
}

// 修改 loadPage 函数以支持搜索参数
async function loadPage(params) {
  let path = "";
  
  // 处理关键词搜索
  if (params?.keyword) {
    // 直接通过fetchDataForPath处理，不需要设置path
    return fetchDataForPath("", params);
  }
  
  // 处理番号搜索
  if (params?.code) {
    // 直接通过fetchDataForPath处理，不需要设置path
    return fetchDataForPath("", params);
  }
  
  // 原有的参数处理逻辑
  if (params?.artistId) {
    try {
      const artistMap = await fetchArtistMap();
    
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.artistId);
    
      if (!isUUID) {
        const normalizedInput = await normalizeArtistName(params.artistId);
        let matchedId = null;
        let matchedName = null;
        let matchScore = 0;
      
        for (const [name, id] of Object.entries(artistMap)) {
          const normalizedMapName = await normalizeArtistName(name);
        
          if (normalizedMapName === normalizedInput) {
            matchedId = id;
            matchedName = name;
            matchScore = 100;
            break;
          }
        
          if (normalizedMapName.includes(normalizedInput)) {
            const score = normalizedInput.length * 10;
            if (score > matchScore) {
              matchScore = score;
              matchedId = id;
              matchedName = name;
            }
          }
        }
      
        if (!matchedId) {
          return [{
            id: "artist-not-found",
            type: "url", 
            title: "艺人未找到",
            description: `未找到艺人: ${params.artistId}\n\n请尝试输入全名或更换艺人名称`,
            backdropPath: "",
            link: ""
          }];
        }
      
        params.artistId = matchedId;
      }
    
      path = `/actor/movie/${params.artistId}.html`;
    } catch (error) {
      console.error("艺人模块处理出错:", error.message);
      return [{
        id: "artist-map-error",
        type: "url",
        title: "艺人列表加载失败",
        description: "请检查网络连接或稍后再试\n错误信息: " + error.message,
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
    const decodedIssuer = decodeURIComponent(params.issuer);
    const encodedIssuer = encodeURIComponent(decodedIssuer);
    path = `/Issuer/${encodedIssuer}`;
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

// ... 其他函数保持不变
