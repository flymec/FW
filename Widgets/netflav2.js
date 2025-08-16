/*
 * 修正版 Netflav 小部件（确保加载正常）
 * 提供 搜索 / 热门 / 最新 / 女优 / 番号 模块
 */

WidgetMetadata = {
  id: "netflav",
  title: "Netflav",
  description: "获取 Netflav 视频",
  author: "chatgpt",
  site: "https://netflav.com",
  version: "1.0.1",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    { title: "Netflav 搜索", functionName: "searchNetflav", params: [
        { name: "keyword", type: "input" },
        { name: "page", type: "page", value: "1" },
        { name: "sort", type: "input" }
      ] },
    { title: "Netflav 热门", functionName: "loadPage", params: [
        { name: "url", type: "constant", value: "https://netflav.com/search?sort=popular" },
        { name: "page", type: "page", value: "1" }
      ] },
    { title: "Netflav 最新", functionName: "loadPage", params: [
        { name: "url", type: "constant", value: "https://netflav.com/search?sort=latest" },
        { name: "page", type: "page", value: "1" }
      ] },
    { title: "Netflav 女优", functionName: "searchNetflav", params: [
        { name: "keyword", type: "input" },
        { name: "page", type: "page", value: "1" }
      ] },
    { title: "Netflav 番号", functionName: "searchNetflav", params: [
        { name: "keyword", type: "input" },
        { name: "page", type: "page", value: "1" }
      ] }
  ]
};

async function searchNetflav(params = {}) {
  const kw = encodeURIComponent(params.keyword || "");
  let url = `https://netflav.com/search?keyword=${kw}`;
  if (params.page) url += `&page=${params.page}`;
  if (params.sort) url += `&sort=${params.sort}`;
  return await loadPage({ ...params, url });
}

async function loadPage(params = {}) {
  let url = params.url || "";
  if (params.page && !url.includes("page=")) {
    url += (url.includes("?") ? "&" : "?") + `page=${params.page}`;
  }
  const html = await getHtml(url);
  if (!html) return [];
  return parseNetflav(html);
}

async function getHtml(url) {
  try {
    const res = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml"
      }
    });
    return (res && res.data) ? res.data : "";
  } catch (e) {
    console.error("获取页面失败:", e.message);
    return "";
  }
}

function parseNetflav(html) {
  const $ = Widget.html.load(html);
  const items = [];
  $("a[href*='/video/']").each((_, el) => {
    try {
      const $el = $(el);
      const href = ($el.attr("href") || "").trim();
      if (!href) return;
      const url = href.startsWith("http") ? href : `https://netflav.com${href}`;
      const img = $el.find("img").attr("data-src") || $el.find("img").attr("src") || "";
      const title = $el.find("img").attr("alt") || $el.text().trim();
      if (title && url) {
        items.push({ id: url, type: "url", title, link: url, backdropPath: img, mediaType: "movie" });
      }
    } catch (err) {
      console.error("解析单个条目失败", err.message);
    }
  });
  return [{ title: "Netflav 列表", childItems: items }];
}

async function loadDetail(link) {
  const html = await getHtml(link);
  return { id: link, type: "detail", videoUrl: "", mediaType: "movie" };
}
