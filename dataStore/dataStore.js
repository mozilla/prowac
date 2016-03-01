/* eslint no-use-before-define: 0 */

const expectedFunctions = [
  { name: 'getHistoricalCrawlData' },
  { name: 'getHistoricalURLData' },
  { name: 'updateWithCurrentCrawlResult' },
  { name: 'finishCurrentCrawl' },
];

let backend;

function setBackendFromPath(backendPath) {
  backend = require(backendPath).default;
  expectedFunctions.forEach((expectedFn) => {
    const fn = backend[expectedFn.name];
    if (!fn) {
      throw new Error(`data store backend must implement ${expectedFn.name}`);
    }
    exported[expectedFn.name] = backend[expectedFn.name];
  });

  return Promise.resolve();
}

function configure(configOpts) {
  let backendPath;
  if (configOpts.backendPath) {
    backendPath = configOpts.backendPath;
  } else if (configOpts.backendName) {
    backendPath = `./backend-${configOpts.backendName}.js`;
  }

  if (!backendPath) {
    return Promise.reject(new Error('dataStore must be configured with a backend'));
  }

  setBackendFromPath(backendPath);

  if (backend.configure) {
    return backend.configure(configOpts.backendOpts || {});
  }
  return Promise.resolve();
}

function flush() {
  if (backend.flush) {
    backend.flush();
  }
}

const exported = {
  configure,
  flush,
};

expectedFunctions.forEach((expectedFn) => {
  exported[expectedFn.name] = () => {
    return Promise.reject(new Error('A data store backend must be set'));
  };
});

export default exported;
