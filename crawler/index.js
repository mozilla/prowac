import alexa from './alexa.js';
import redis from '../db/redis.js';

function setCurrentCrawl(client, crawlKey) {
  return redis.set(client, 'currentCrawl', crawlKey);
}

// fetches all required resources from url, builds an Object and returns
// a promise
function fetchSite(url) {
  // XXX write this part
  throw new Error('not implemented ' + url);
}

// returns key to the saved crawl
function saveCrawl(client, topSites, key) {
  if (!key) {
    key = new Date().toISOString();
  }
  return topSites.forEach((url) => fetchSite(url)
    // XXX change to the current schema
    .then((siteData) => redis.hmset(client, key, url, siteData))
  )
  .then(() => key);
}

// fetches top sites and saves in database
// checks if a crawl is needed
function fetchAlexaTopSites() {
  let client;
  return redis.getClient()
  .then((redisClient) => {
    client = redisClient;
  })
  .then(() => alexa.fetchTopSites())
  .then((topSites) => saveCrawl(client, topSites))
  .then((crawlKey) => setCurrentCrawl(client, crawlKey))
  .then(() => redis.quit(client));
}

export default {
  fetchAlexaTopSites,
};

const test = {
  saveCrawl,
  setCurrentCrawl,
};

export { test };
