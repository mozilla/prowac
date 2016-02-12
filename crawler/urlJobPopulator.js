let backend;
let progressCallback;
let finishedCallback;

function configure(configOpts) {
  let backendPath;
  if (configOpts.backendPath) {
    backendPath = configOpts.backendPath;
  } else if (configOpts.backendName) {
    backendPath = `./UrlJobPopulatorBackends/${configOpts.backendName}.js`;
  }

  if (!backendPath) {
    return Promise.reject(new Error('urlJobPopulator must be configured with a backend'));
  }

  if (!configOpts.progressCallback) {
    return Promise.reject(new Error('A progress callback must be specified'));
  }

  if (!configOpts.finishedCallback) {
    return Promise.reject(new Error('A finished callback must be specified'));
  }

  backend = require(backendPath).default;

  if (!backend.populate) {
    backend = null;
    return Promise.reject(new Error('urlJobPopulator backend must implement populate'));
  }

  progressCallback = configOpts.progressCallback;
  finishedCallback = configOpts.finishedCallback;

  let configPromise = Promise.resolve();
  if (backend.configure) {
    configPromise = backend.configure(configOpts.backendConfigOpts || {});
  }

  return configPromise.catch((err) => {
    progressCallback = null;
    finishedCallback = null;
    backend = null;
    throw err;
  });
}

function populate() {
  if (!backend) {
    throw new Error('urlJobPopulator must be configured');
  }

  backend.populate(progressCallback, finishedCallback);
}

export default {
  configure,
  populate,
};
