import redis from 'redis';

let client;

function getHistoricalCrawlData(startIndex, count) {
  return new Promise((resolve, reject) => {
    client.lrange('aggregated-info', startIndex, startIndex + count - 1, (err, response) => {
      if (err) {
        return reject(err);
      }
      response.forEach((json, index, arr) => {
        arr[index] = JSON.parse(json);
      });
      return resolve(response);
    });
  });
}

function getHistoricalURLData(url, count) {
  return new Promise((resolve, reject) => {
    const key = `historical-data:${url}`;
    client.lrange(key, 0, count - 1, (err, response) => {
      if (err) {
        return reject(err);
      }
      const ret = response.map((json) => {
        return JSON.parse(json);
      });
      return resolve(ret);
    });
  });
}

function addPromise(promises) {
  let resolve;
  let reject;
  const p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promises.push(p);

  return (err, response) => {
    if (err) {
      return reject(err);
    }
    return resolve(response);
  };
}

function updateWithCurrentCrawlResult(url, data) {
  const promises = [];

  client.lpush(`historical-data:${url}`, JSON.stringify(data), addPromise(promises));

  for (const i in data) {
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

      const promises = [];
      client.lpush('aggregated-info', JSON.stringify(response), addPromise(promises));
      client.del('current-crawl-aggregated-data', addPromise(promises));
      return Promise.all(promises).then(() => {
        return resolve();
      });
    });
  });
}

function configure(opts) {
  return new Promise((resolve, reject) => {
    if (!opts.url) {
      return reject(new Error('Redis URL must be specified'));
    }

    let createClientOpts = {};
    if (opts.createClientOpts) {
      createClientOpts = opts.createClientOpts;
    }

    try {
      client = redis.createClient(opts.url, createClientOpts);
    } catch (err) {
      return reject(err);
    }

    if (!opts.dbTestNumber) {
      return resolve();
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
  updateWithCurrentCrawlResult,
  finishCurrentCrawl,
  configure,
};
