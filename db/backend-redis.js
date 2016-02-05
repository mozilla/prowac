import redis from 'redis';

var client;

function getHistoricalCrawlData(startIndex, count) {
  return new Promise((resolve, reject) => {
    client.lrange('aggregated-info', startIndex, startIndex + count - 1, (err, response) => {
      if (err) {
        return reject(err);
      };
      response.forEach((json, index, arr) => {
        arr[index] = JSON.parse(json);
      });
      return resolve(response);
    });
  });
}

function getHistoricalURLData(url, count) {
  return new Promise((resolve, reject) => {
    let key = 'historical-data:' + url;
    client.lrange(key, 0, count - 1, (err, response) => {
      if (err) {
        return reject(err);
      };
      response.forEach((json, index, arr) => {
        arr[index] = JSON.parse(json);
      });
      return resolve(response);
    });
  });
}

function popURL() {
  return new Promise((resolve, reject) => {
    client.lpop('current-crawl-remaining-urls', (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response);
    });
  });
}

function pushURLs(urls) {
  return new Promise((resolve, reject) => {
    client.lpush('current-crawl-remaining-urls', urls, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

function addPromise(promises) {
  let resolve;
  let reject;
  let p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promises.push(p);

  return ((err, response) => {
    if (err) {
      return reject(err);
    }
    return resolve(response);
  });
}

function updateWithCurrentCrawlResult(url, data) {
  let promises = [];

  client.lpush('historical-data:' + url, JSON.stringify(data), addPromise(promises));

  for (var i in data) {
    if (data.hasOwnProperty(i) && data[i] === true) {
      client.hincrby('current-crawl-aggregated-data', i, 1, addPromise(promises));
    }
  }
  client.hincrby('current-crawl-aggregated-data', 'totalRecords', 1, addPromise(promises));

  return Promise.all(promises);
}

function finishCurrentCrawl() {
  return new Promise((resolve, reject) => {
    client.hgetall('current-crawl-aggregated-data', (err, response) => {
      if (err) {
        return reject(err);
      }

      let promises = [];
      client.lpush('aggregated-info', JSON.stringify(response), addPromise(promises));
      client.del('current-crawl-aggregated-data', addPromise(promises));
      return Promise.all(promises).then(() => {
        return resolve();
      });
    });
  });
}

function configure(opts) {
  let url = process.env.REDIS_URL;
  if (opts.url) {
    url = opts.url;
  }

  let createClientOpts = {};
  if (opts.createClientOpts) {
    createClientOpts = opts.createClientOpts;
  }

  client = redis.createClient(url, createClientOpts);

  return new Promise((resolve, reject) => {
    if (!opts.dbTestNumber) {
      return Promise.resolve();
    }

    client.select(opts.dbTestNumber, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

export default {
  getHistoricalCrawlData,
  getHistoricalURLData,
  popURL,
  pushURLs,
  updateWithCurrentCrawlResult,
  finishCurrentCrawl,
  configure,
};
