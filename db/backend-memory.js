var aggregatedInfo = [];
var historicalData = {};
var currentCrawlRemainingUrls = [];
var currentCrawlAggregatedData;

resetCurrentCrawlAggregatedData();

function resetCurrentCrawlAggregatedData() {
  currentCrawlAggregatedData = {
    haveProbe1: 0,
    haveProbe2: 0,
    haveProbe3: 0,
  };
}

function getHistoricalCrawlData(startIndex, count) {
  if (startIndex >= aggregatedInfo.length) {
    return Promise.resolve([]);
  }

  let endIndex = Math.max(startIndex + count, aggregatedInfo.length);
  return Promise.resolve(aggregatedInfo.slice(startIndex, endIndex));
}

function getHistoricalURLData(url, count) {
  let urlData = historicalData[url];
  if (!urlData || urlData.length === 0) {
    return Promise.resolve([]);
  }

  let endIndex = Math.max(count, urlData.length);
  return Promise.resolve(urlData.slice(0, endIndex));
}

function popURL() {
  if (currentCrawlRemainingUrls.length === 0) {
    return Promise.reject(new Error('URL list is empty'));
  }

  return Promise.resolve(currentCrawlRemainingUrls.pop());
}

function pushURLs(urls) {
  currentCrawlRemainingUrls = currentCrawlRemainingUrls.concat(urls);
  return Promise.resolve();
}

function updateWithCurrentCrawlResult(url, data) {
  let urlData = historicalData[url];
  if (!urlData) {
    historicalData[url] = [];
    urlData = historicalData[url];
  }
  urlData.push(data);

  if (data.hasProbe1) {
    currentCrawlAggregatedData.haveProbe1 += 1;
  }

  if (data.hasProbe2) {
    currentCrawlAggregatedData.haveProbe2 += 1;
  }

  if (data.hasProbe3) {
    currentCrawlAggregatedData.haveProbe3 += 1;
  }
}

function finishCurrentCrawl() {
  aggregatedInfo.push(currentCrawlAggregatedData);
  resetCurrentCrawlAggregatedData();
  return Promise.resolve();
}

export default {
  getHistoricalCrawlData,
  getHistoricalURLData,
  popURL,
  pushURLs,
  updateWithCurrentCrawlResult,
  finishCurrentCrawl,
};
