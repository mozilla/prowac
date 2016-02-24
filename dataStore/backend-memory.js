const aggregatedInfo = [];
const historicalData = {};
let currentCrawlAggregatedData;

function resetCurrentCrawlAggregatedData() {
  currentCrawlAggregatedData = {
    totalRecords: 0,
  };
}

resetCurrentCrawlAggregatedData();

function getHistoricalCrawlData(startIndex, count) {
  if (startIndex >= aggregatedInfo.length) {
    return Promise.resolve([]);
  }

  const endIndex = Math.min(startIndex + count, aggregatedInfo.length);
  return Promise.resolve(aggregatedInfo.slice(startIndex, endIndex));
}

function getHistoricalURLData(url, count) {
  const urlData = historicalData[url];
  if (!urlData || urlData.length === 0) {
    return Promise.resolve([]);
  }

  const endIndex = Math.min(count, urlData.length);
  return Promise.resolve(urlData.slice(0, endIndex));
}

function updateWithCurrentCrawlResult(url, data) {
  let urlData = historicalData[url];
  if (!urlData) {
    historicalData[url] = [];
    urlData = historicalData[url];
  }
  urlData.push(data);

  for (const i in data) {
    if (data.hasOwnProperty(i) && data[i] === true) {
      if (!currentCrawlAggregatedData[i]) {
        currentCrawlAggregatedData[i] = 1;
      } else {
        currentCrawlAggregatedData[i] += 1;
      }
    }
  }
  currentCrawlAggregatedData.totalRecords += 1;
  return Promise.resolve();
}

function finishCurrentCrawl() {
  aggregatedInfo.push(currentCrawlAggregatedData);
  resetCurrentCrawlAggregatedData();
  return Promise.resolve();
}

export default {
  getHistoricalCrawlData,
  getHistoricalURLData,
  updateWithCurrentCrawlResult,
  finishCurrentCrawl,
};
