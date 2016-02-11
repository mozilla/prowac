let list = [
  'google.com',
  'yahoo.com',
  'bing.com',
  'duckduckgo.com',
  'eff.org',
  'mozilla.org',
  'mozilla.com',
];

function configure(opts) {
  if (opts.urls) {
    list = opts.urls;
  }
  return Promise.resolve();
}

function populate(progressCallback, finishedCallback) {
  let currentIndex = 0;
  setTimeout(() => {
    const ret = [];
    if (currentIndex === list.length) {
      return finishedCallback();
    }
    ret.push(list[currentIndex++]);
    if (currentIndex === list.length) {
      return progressCallback(ret);
    }
    ret.push(list[currentIndex++]);

    return progressCallback(ret);
  }, 100);
}

export default {
  configure,
  populate,
};
