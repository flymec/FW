// Jable & Netflav Widget (FW-Widgets Compatible) with filters, webview play, pagination & HTML parsing

const KEY_PICTURE = "image"; // Change to match host app's expected key name
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

WidgetMetadata = {
  id: "video_search",
  title: "Jable & Netflav 搜索",
  description: "搜索 Jable 和 Netflav 的视频、女优、番号，支持筛选和播放",
  author: "nibiru & ChatGPT",
  site: "https://github.com/quantumultxx/FW-Widgets",
  version: "2.1.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [/* same params definition as before */]
};

function addPaginationControls(items, currentPage, totalPages, fnName, params) {
  if (currentPage > 1) items.push({ title: "上一页", actions: [{ action: fnName, params: { ...params, page: currentPage - 1 } }] });
  if (currentPage < totalPages) items.push({ title: "下一页", actions: [{ action: fnName, params: { ...params, page: currentPage + 1 } }] });
  return items;
}

function makePlayableItem(title, subtitle, img, url, extra = {}) {
  return { title, subtitle, [KEY_PICTURE]: img, url, actions: [{ title: "播放", type: "webview", url }], extra };
}

async function httpGet(url) {
  const headers = { 'User-Agent': UA };
  if (typeof $task !== 'undefined') {
    let resp = await $task.fetch({ url, headers });
    return resp.body;
  } else if (typeof $httpClient !== 'undefined') {
    return new Promise((resolve) => { $httpClient.get({ url, headers }, (_, __, data) => resolve(data)); });
  } else {
    let r = await fetch(url, { headers });
    return await r.text();
  }
}

function filterItemsByParams(items, { duration, quality }) {
  return items.filter(it => {
    let pass = true;
    if (duration === 'short') pass = pass && /([0-9]{1,2}):([0-5][0-9])/.test(it.subtitle) && parseInt(RegExp.$1) < 10;
    if (duration === 'long') pass = pass && /([0-9]{1,2}):([0-5][0-9])/.test(it.subtitle) && parseInt(RegExp.$1) > 30;
    if (quality === 'hd') pass = pass && /HD|720p/i.test(it.subtitle);
    if (quality === '4k') pass = pass && /4K/i.test(it.subtitle);
    return pass;
  });
}

function parseVideoList(html, base) {
  const items = [];
  const re = /<a[^>]+href=\"(.*?)\"[\s\S]*?(?:data-src|src)=\"(.*?)\"[\s\S]*?<.*?class=\"title.*?\">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    const url = new URL(m[1], base).href;
    const img = new URL(m[2], base).href;
    const title = m[3].replace(/<[^>]+>/g, '').trim();
    items.push(makePlayableItem(title, '', img, url));
  }
  return items;
}

async function searchJable(params) {
  const { keyword, sort_by, from, duration, quality } = params;
  const url = `https://jable.tv/search/${encodeURIComponent(keyword)}/?sort_by=${sort_by}&from=${from}`;
  const html = await httpGet(url);
  let items = parseVideoList(html, 'https://jable.tv');
  items = filterItemsByParams(items, { duration, quality });
  return { items: addPaginationControls(items, Number(from), 50, 'searchJable', params) };
}

async function loadJableHot(params) {
  const { page = 1 } = params;
  const html = await httpGet(`https://jable.tv/?from=${page}`);
  let items = parseVideoList(html, 'https://jable.tv');
  return { items: addPaginationControls(items, Number(page), 50, 'loadJableHot', params) };
}

async function searchNetflav(params) {
  const { keyword, category, page, duration, quality } = params;
  let url;
  if (category === 'hot') url = `https://netflav.com/popular?page=${page}`;
  else if (category === 'actress') url = `https://netflav.com/search/actress/${encodeURIComponent(keyword)}?page=${page}`;
  else if (category === 'code') url = `https://netflav.com/search/code/${encodeURIComponent(keyword)}?page=${page}`;
  else url = `https://netflav.com/search/${encodeURIComponent(keyword)}?page=${page}`;
  const html = await httpGet(url);
  let items = parseVideoList(html, 'https://netflav.com');
  items = filterItemsByParams(items, { duration, quality });
  return { items: addPaginationControls(items, Number(page), 50, 'searchNetflav', params) };
}
