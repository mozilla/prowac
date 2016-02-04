import alexa from './lib/alexa.js';
import redisHelper from './lib/redis-helper.js';

function setCurrentCrawl(redis, crawlKey) {
  return new Promise((resolve, reject) => {
    redis.set('currentCrawl', crawlKey, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

// fetches all required resources from url, builds an Object and returns
// a promise
function fetchSite(url) {
  // XXX write this part
  throw new Error('not implemented ' + url);
}

// returns key to the saved crawl
function saveCrawl(redis, topSites, key) {
  if (!key) {
    key = new Date().toISOString();
  }
  return topSites.forEach((url) => fetchSite(url)
    .then((siteData) => new Promise((resolve, reject) => {
      redis.hmset(key, url, siteData, (err) => redis.promiseCallback(err, null, resolve, reject));
    }))
  )
  .then(() => key);
}

// fetches top sites and saves in database
// checks if a crawl is needed
function fetchAlexaTopSites() {
  let redis;
  return redisHelper.getClient()
  .then((client) => {
    redis = client;
    return redis;
  })
  .then(() => alexa.fetchTopSites())
  .then((topSites) => saveCrawl(redis, topSites))
  .then((crawlKey) => setCurrentCrawl(redis, crawlKey))
  .then(() => redis.quit());
}

export default {
  fetchAlexaTopSites,
};
