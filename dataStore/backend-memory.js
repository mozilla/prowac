const aggregatedInfo = [];
const historicalData = {};
let currentCrawlAggregatedData = {};

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
  const timeStamp = new Date();
  let urlData = historicalData[url];
  if (!urlData) {
    historicalData[url] = [];
    urlData = historicalData[url];
  }
  const hData = data;
  hData.timeStamp = timeStamp;
  urlData.push(hData);
  data.totalRecords = true;

  currentCrawlAggregatedData.timeStamp = timeStamp;
  for (const i in data) {
    if (data.hasOwnProperty(i)) {
      if (data[i] === true) {
        if (!currentCrawlAggregatedData[i]) {
          currentCrawlAggregatedData[i] = 1;
        } else {
          currentCrawlAggregatedData[i] += 1;
        }
      } else {
        if (currentCrawlAggregatedData[i] === undefined) {
          currentCrawlAggregatedData[i] = 0;
        }
      }
    }
  }
  return Promise.resolve();
}

function finishCurrentCrawl() {
  aggregatedInfo.push(currentCrawlAggregatedData);
  currentCrawlAggregatedData = {};
  return Promise.resolve();
}

export default {
  getHistoricalCrawlData,
  getHistoricalURLData,
  updateWithCurrentCrawlResult,
  finishCurrentCrawl,
};
