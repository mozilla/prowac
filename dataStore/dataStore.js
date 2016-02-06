const expectedFunctions = [
  { name: 'getHistoricalCrawlData' },
  { name: 'getHistoricalURLData' },
  { name: 'updateWithCurrentCrawlResult' },
  { name: 'finishCurrentCrawl' },
];

var backend;

function setBackend(backendName, configOpts) {
  return setBackendFromPath('./backend-' + backendName + '.js', configOpts);
}

var exported = {
  setBackend,
  setBackendFromPath,
};
expectedFunctions.forEach((expectedFn) => {
  exported[expectedFn.name] = function() {
    return Promise.reject(new Error('A data store backend must be set'));
  }
});

function setBackendFromPath(backendPath, configOpts) {
  backend = require(backendPath).default;
  expectedFunctions.forEach((expectedFn) => {
    let fn = backend[expectedFn.name];
    if (!fn) {
      throw new Error('data store backend must implement ' + expectedFn.name);
    }
    exported[expectedFn.name] = backend[expectedFn.name];
  });

  if (backend['configure']) {
    return backend.configure(configOpts || {});
  }

  return Promise.resolve();
}

export default exported;
