let list = [
  'google.com',
  'yahoo.com',
  'bing.com',
  'duckduckgo.com',
  'eff.org',
  'mozilla.org',
  'mozilla.com',
  'wadi-pwa.sloppy.zone'
];

let currentIndex = 0;
let intervalID;

function configure(opts) {
  if (opts.urls) {
    list = opts.urls;
  }
  return Promise.resolve();
}

function actuallyPopulate(progressCallback, finishedCallback) {
  const ret = [];
  if (currentIndex === list.length) {
    clearInterval(intervalID);
    return finishedCallback();
  }
  ret.push(list[currentIndex++]);
  if (currentIndex === list.length) {
    return progressCallback(ret);
  }
  ret.push(list[currentIndex++]);

  return progressCallback(ret);
}

function populate(progressCallback, finishedCallback) {
  intervalID = setInterval(actuallyPopulate.bind(null, progressCallback, finishedCallback), 100);
}

export default {
  configure,
  populate,
};
