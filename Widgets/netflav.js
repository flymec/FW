/**
 * Jable & Netflav Widget (FW-Widgets compatible)
 * Author: nibiru + ChatGPT
 * Version: 2.0.0
 *
 * Notes:
 * - Designed for FW-Widgets style runtimes (Quantumult X / Surge / Loon-like),
 *   but also attempts to run in generic JS with fetch().
 * - Uses lightweight HTML parsing via RegExp to avoid DOMParser dependency.
 * - Returns a uniform list schema FW-Widgets commonly accepts:
 *   { items: [ { title, subtitle, picture, url, actions: [{title,url}], extra } ] }
 * - If your FW-Widgets host expects a different field name (e.g. "image" instead of "picture"),
 *   change KEY_PICTURE below.
 */

/******************** Config ********************/
const KEY_PICTURE = "picture"; // adapt to your host: e.g., "image" | "icon"
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

/******************** Metadata ********************/
// Keep the original Jable metadata and add Netflav modules
var WidgetMetadata = {
  id: "video_search_combo",
  title: "Jable & Netflav",
  description: "获取 Jable 与 Netflav 视频/女优/番号",
  author: "nibiru & ChatGPT",
  site: "https://github.com/quantumultxx/FW-Widgets",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // Jable: 搜索
    {
      title: "Jable 搜索",
      description: "搜索 Jable 视频",
      requiresWebView: false,
      functionName: "searchJable",
      cacheDuration: 3600,
      params: [
        { name: "keyword", title: "关键词", type: "input", description: "关键词" },
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
    // Jable: 热门
    {
      title: "Jable 热门",
      description: "热门影片",
      requiresWebView: false,
      functionName: "loadJableHot",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
    // Netflav: 通用搜索（女优 / 番号 / 关键词 / 热门）
    {
      title: "Netflav 搜索",
      description: "搜索 Netflav 女优、番号、视频",
      requiresWebView: false,
      functionName: "searchNetflav",
      cacheDuration: 3600,
      params: [
        {
          name: "keyword",
          title: "关键词/番号/女优名",
          type: "input",
          description: "输入要搜索的内容；热门可留空",
        },
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          description: "选择搜索类别",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "女优", value: "actress" },
            { title: "番号", value: "code" },
            { title: "热门视频", value: "hot" },
          ],
          value: "all",
        },
        { name: "page", title: "页码", type: "page", description: "页码", value: "1" },
      ],
    },
  ],
};

/******************** HTTP Helpers ********************/
function envHas(obj, key) {
  try {
    return obj && typeof obj[key] !== "undefined";
  } catch (e) {
    return false;
  }
}

async function httpGet(url, headers = {}) {
  headers["User-Agent"] = headers["User-Agent"] || UA;
  // Surge / Loon style
  if (envHas(this, "$httpClient")) {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url, headers }, (err, resp, data) => {
        if (err) return reject(err);
        resolve({ status: resp.status || resp.statusCode, headers: resp.headers, data });
      });
    });
  }
  // Quantumult X style
  if (envHas(this, "$task")) {
    return $task
      .fetch({ url, headers, method: "GET" })
      .then((resp) => ({ status: resp.statusCode, headers: resp.headers, data: resp.body }));
  }
  // Native fetch
  if (typeof fetch === "function") {
    const r = await fetch(url, { headers, method: "GET" });
    const text = await r.text();
    return { status: r.status, headers: Object.fromEntries(r.headers.entries()), data: text };
  }
  throw new Error("No HTTP runtime available");
}

/******************** Utilities ********************/
function toAbs(base, href) {
  try {
    if (!href) return base;
    if (/^https?:\/\//i.test(href)) return href;
    const u = new URL(base);
    if (href.startsWith("/")) return `${u.protocol}//${u.host}${href}`;
    const prefix = base.replace(/\/?[^/]*$/, "/");
    return prefix + href;
  } catch {
    return href;
  }
}

function htmlDecode(str = "") {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pick(re, html) {
  const m = re.exec(html);
  return m ? m[1] : "";
}

function clean(text = "") {
  return htmlDecode(text).replace(/\s+/g, " ").trim();
}

function buildItem({ title, subtitle = "", picture = "", url = "", actions = [], extra = {} }) {
  const item = { title: clean(title), subtitle: clean(subtitle), url, actions, extra };
  item[KEY_PICTURE] = picture;
  return item;
}

function listResult(items = [], pagination = {}) {
  return { items, pagination };
}

/******************** Jable: Parsers ********************/
// Search URL: https://jable.tv/search/<keyword>/?sort_by=<sort>&from=<page>
function jableSearchUrl(keyword, sort_by, from = 1) {
  const k = encodeURIComponent(keyword || "");
  const s = sort_by || "post_date";
  const p = Number(from) || 1;
  return `https://jable.tv/search/${k}/?sort_by=${s}&from=${p}`;
}

function parseJableList(html, base = "https://jable.tv/") {
  const items = [];
  // Each card roughly like: <a href="/videos/xxxx" class="video-box"> ... <img data-src="..."> ... <div class="detail"> <span class="title"> ...
  const cardRe = /<a[^>]*class=\"video-box[^\"]*\"[^>]*href=\"([^\"]+)\"[\s\S]*?data-src=\"([^\"]+)\"[\s\S]*?title=\"([^\"]+)\"/g;
  let m;
  while ((m = cardRe.exec(html))) {
    const href = toAbs(base, m[1]);
    const img = toAbs(base, m[2]);
    const title = clean(m[3]);
    // Pull code if present in title like ABC-123
    const code = (title.match(/[A-Z]{2,}-?\d{2,4}/i) || [""])[0];
    items.push(
      buildItem({
        title,
        subtitle: code ? `番号：${code}` : "",
        picture: img,
        url: href,
        actions: [
          { title: "打开视频", url: href },
          { title: "复制链接", url: href },
        ],
        extra: { site: "jable" },
      })
    );
  }
  // Try actresses block if present
  const actressBlock = html.match(/<div[^>]*class=\"actor-list[\s\S]*?<\/div>\s*<\/div>/);
  if (actressBlock) {
    const actressRe = /<a[^>]*href=\"([^\"]+)\"[^>]*>\s*<div[^>]*class=\"actor-box\"[\s\S]*?data-src=\"([^\"]+)\"[\s\S]*?<div[^>]*class=\"name\"[^>]*>([\s\S]*?)<\//g;
    let a;
    while ((a = actressRe.exec(actressBlock[0]))) {
      items.push(
        buildItem({
          title: clean(a[3]),
          subtitle: "女优",
          picture: toAbs(base, a[2]),
          url: toAbs(base, a[1]),
          actions: [{ title: "查看女优主页", url: toAbs(base, a[1]) }],
          extra: { site: "jable", type: "actress" },
        })
      );
    }
  }
  return items;
}

/******************** Netflav: Parsers ********************/
// We support simple endpoints based on observed patterns. These may change; adjust regex as needed.
function netflavSearchUrls(keyword, category = "all", page = 1) {
  const urls = [];
  const base = "https://netflav.com";
  const k = encodeURIComponent(keyword || "");
  const p = Number(page) || 1;

  if (category === "hot") {
    urls.push(`${base}/?page=${p}`); // homepage pagination often lists trending
    urls.push(`${base}/popular?page=${p}`); // fallback popular
    return urls;
  }

  if (!keyword && category !== "hot") return urls; // nothing to search

  switch (category) {
    case "actress":
      // actress search; site may use /search?keyword= or /search/keyword
      urls.push(`${base}/search?keyword=${k}&page=${p}`);
      urls.push(`${base}/search/${k}?page=${p}`);
      break;
    case "code":
      // search by code
      urls.push(`${base}/search/${k}?page=${p}`);
      urls.push(`${base}/search?keyword=${k}&page=${p}`);
      break;
    case "all":
    default:
      urls.push(`${base}/search/${k}?page=${p}`);
      urls.push(`${base}/search?keyword=${k}&page=${p}`);
      break;
  }
  return urls;
}

function parseNetflavList(html, base = "https://netflav.com") {
  const items = [];
  // Video cards example (approx.):
  // <a href="/video/xxxx" class="..."> <img data-src or src="..."> <div class="...">Title</div>
  const videoRe = /<a[^>]*href=\"(\/video\/[^\"]+)\"[\s\S]*?(?:data-src|src)=\"([^\"]+)\"[\s\S]*?>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = videoRe.exec(html))) {
    const href = toAbs(base, m[1]);
    const img = toAbs(base, m[2]);
    const raw = clean(m[3]);
    // Extract a plausible title (strip tags if any remain)
    const title = clean(raw.replace(/<[^>]+>/g, ""));
    const code = (title.match(/[A-Z]{2,}-?\d{2,4}/i) || [""])[0];
    items.push(
      buildItem({
        title,
        subtitle: code ? `番号：${code}` : "",
        picture: img,
        url: href,
        actions: [
          { title: "打开视频", url: href },
          { title: "复制链接", url: href },
        ],
        extra: { site: "netflav" },
      })
    );
  }

  // Actress blocks (approx.): links like /actress/<name or id>
  const actressRe = /<a[^>]*href=\"(\/actress\/[^\"]+)\"[^>]*>[\s\S]*?(?:data-src|src)=\"([^\"]+)\"[\s\S]*?<[^>]*class=\"[^\"]*name[^\"]*\"[^>]*>([\s\S]*?)<\//g;
  let a;
  while ((a = actressRe.exec(html))) {
    items.push(
      buildItem({
        title: clean(a[3]),
        subtitle: "女优",
        picture: toAbs(base, a[2]),
        url: toAbs(base, a[1]),
        actions: [{ title: "查看女优主页", url: toAbs(base, a[1]) }],
        extra: { site: "netflav", type: "actress" },
      })
    );
  }

  // Attempt to parse hot/trending sections with data attributes
  const hotSection = html.match(/<section[^>]*class=\"[^\"]*(popular|trending)[^\"]*\"[\s\S]*?<\/section>/i);
  if (hotSection) {
    const hotRe = /<a[^>]*href=\"(\/video\/[^\"]+)\"[\s\S]*?title=\"([^\"]+)\"[\s\S]*?(?:data-src|src)=\"([^\"]+)\"/g;
    let h;
    while ((h = hotRe.exec(hotSection[0]))) {
      items.push(
        buildItem({
          title: clean(h[2]),
          subtitle: "热门",
          picture: toAbs(base, h[3]),
          url: toAbs(base, h[1]),
          actions: [{ title: "打开视频", url: toAbs(base, h[1]) }],
          extra: { site: "netflav", tag: "hot" },
        })
      );
    }
  }

  return items;
}

/******************** Module Implementations ********************/
// Jable Search
async function searchJable(params = {}) {
  const { keyword = "", sort_by = "post_date", from = 1 } = params;
  const url = jableSearchUrl(keyword, sort_by, from);
  const { status, data } = await httpGet(url);
  if (status !== 200) return listResult([], { error: `HTTP ${status}` });
  const items = parseJableList(data);
  return listResult(items, { next: jableSearchUrl(keyword, sort_by, Number(from) + 1) });
}

// Jable Hot
async function loadJableHot(params = {}) {
  const page = Number(params.page || 1);
  const url = `https://jable.tv/?from=${page}`;
  const { status, data } = await httpGet(url);
  if (status !== 200) return listResult([], { error: `HTTP ${status}` });
  const items = parseJableList(data);
  return listResult(items, { next: `https://jable.tv/?from=${page + 1}` });
}

// Netflav Search (actress / code / all / hot)
async function searchNetflav(params = {}) {
  const { keyword = "", category = "all", page = 1 } = params;
  const urls = netflavSearchUrls(keyword, category, page);
  if (!urls.length) return listResult([], { info: "请输入关键词或选择热门" });

  const results = [];
  for (const url of urls) {
    try {
      const { status, data } = await httpGet(url);
      if (status === 200) results.push(...parseNetflavList(data));
    } catch (e) {
      // ignore this URL and try the next
    }
  }

  // Deduplicate by url
  const seen = new Set();
  const items = results.filter((it) => {
    if (seen.has(it.url)) return false;
    seen.add(it.url);
    return true;
  });

  const nextPage = Number(page) + 1;
  return listResult(items, { next: { keyword, category, page: nextPage } });
}

/******************** Optional: Export for FW-Widgets ********************/
// Some hosts call functions by name from global scope.
// Ensure we attach to globalThis for safety.
(function exposeGlobals() {
  const api = { WidgetMetadata, searchJable, loadJableHot, searchNetflav };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  try {
    Object.assign(typeof globalThis !== "undefined" ? globalThis : this, api);
  } catch {}
})();

/******************** End ********************/
