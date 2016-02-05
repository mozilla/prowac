const expectedFunctions = [
  { name: 'getHistoricalCrawlData' },
  { name: 'getHistoricalURLData' },
  { name: 'popURL' },
  { name: 'pushURLs' },
  { name: 'updateWithCurrentCrawlResult' },
  { name: 'finishCurrentCrawl' },
];

var backend;

function setBackend(backendName) {
  return setBackendFromPath('./backend-' + backendName + '.js');
}

var exported = {
  setBackend,
  setBackendFromPath,
};
expectedFunctions.forEach((expectedFn) => {
  exported[expectedFn.name] = function() {
    return Promise.reject(new Error('A DB backend must be set'));
  }
});

function setBackendFromPath(backendPath) {
  backend = require(backendPath).default;
  expectedFunctions.forEach((expectedFn) => {
    let fn = backend[expectedFn.name];
    if (!fn) {
      throw new Error('DB backend must implement ' + expectedFn.name);
    }
    exported[expectedFn.name] = backend[expectedFn.name];
  });
}

export default exported;
