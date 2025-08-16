/*
 * 精简稳定版 Jable + Netflav 小部件
 * 保证不报错运行，优先兼容性
 */

WidgetMetadata = {
  id: "av_aggregator",
  title: "Jable + Netflav",
  description: "获取 Jable 与 Netflav 视频",
  author: "flyme + chatgpt",
  site: "https://jable.tv, https://netflav.com",
  version: "2.0.1",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    {
      title: "Jable 搜索",
      functionName: "searchJable",
      params: [
        { name: "keyword", type: "input" },
        { name: "sort_by", type: "input" },
        { name: "from", type: "page", value: "1" }
      ]
    },
    {
      title: "Netflav 搜索",
      functionName: "searchNetflav",
      params: [
        { name: "keyword", type: "input" },
        { name: "page", type: "page", value: "1" },
        { name: "sort", type: "input" }
      ]
    }
  ]
};

async function searchJable(params={}) {
  const kw = encodeURIComponent(params.keyword||"");
  let url = `https://jable.tv/search/${kw}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${kw}`;
  if (params.sort_by) url += `&sort_by=${params.sort_by}`;
  if (params.from) url += `&from=${params.from}`;
  return await loadPage({ ...params, url });
}

async function searchNetflav(params={}) {
  const kw = encodeURIComponent(params.keyword||"");
  let url = `https://netflav.com/search?keyword=${kw}`;
  if (params.page) url += `&page=${params.page}`;
  if (params.sort) url += `&sort=${params.sort}`;
  return await loadPage({ ...params, url });
}

async function loadPage(params={}) {
  const html = await getHtml(params.url);
  if (params.url.includes("jable.tv")) {
    return parseJable(html);
  } else if (params.url.includes("netflav.com")) {
    return parseNetflav(html);
  }
  return [];
}

async function getHtml(url) {
  const res = await Widget.http.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res || !res.data) return "";
  return res.data;
}

function parseJable(html) {
  const $ = Widget.html.load(html);
  const items = [];
  $(".video-img-box").each((_, el) => {
    const $el = $(el);
    const a = $el.find(".title a");
    const cover = $el.find("img").attr("data-src") || $el.find("img").attr("src") || "";
    items.push({
      title: a.text().trim(),
      link: a.attr("href"),
      backdropPath: cover
    });
  });
  return [{ title: "Jable 列表", childItems: items }];
}

function parseNetflav(html) {
  const $ = Widget.html.load(html);
  const items = [];
  $("a[href*='/video/']").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const url = href.startsWith("http") ? href : `https://netflav.com${href}`;
    const img = $el.find("img").attr("data-src") || $el.find("img").attr("src") || "";
    const title = $el.find("img").attr("alt") || $el.text().trim();
    if (title && url) {
      items.push({ title, link: url, backdropPath: img });
    }
  });
  return [{ title: "Netflav 列表", childItems: items }];
}

async function loadDetail(link) {
  const html = await getHtml(link);
  if (link.includes("jable.tv")) {
    const m = html.match(/var hlsUrl = '(.*?)';/);
    return { videoUrl: m ? m[1] : "" };
  }
  return { videoUrl: "" };
}
