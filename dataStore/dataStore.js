/* eslint no-use-before-define: 0 */

const expectedFunctions = [
  { name: 'getHistoricalCrawlData' },
  { name: 'getHistoricalURLData' },
  { name: 'updateWithCurrentCrawlResult' },
  { name: 'finishCurrentCrawl' },
];

const exported = {
  setBackend,
  setBackendFromPath,
};

let backend;

function setBackendFromPath(backendPath, configOpts) {
  backend = require(backendPath).default;
  expectedFunctions.forEach((expectedFn) => {
    const fn = backend[expectedFn.name];
    if (!fn) {
      throw new Error(`data store backend must implement ${expectedFn.name}`);
    }
    exported[expectedFn.name] = backend[expectedFn.name];
  });

  if (backend.configure) {
    return backend.configure(configOpts || {});
  }

  return Promise.resolve();
}

function setBackend(backendName, configOpts) {
  return setBackendFromPath(`./backend-${backendName}.js`, configOpts);
}

expectedFunctions.forEach((expectedFn) => {
  exported[expectedFn.name] = () => {
    return Promise.reject(new Error('A data store backend must be set'));
  };
});

export default exported;
