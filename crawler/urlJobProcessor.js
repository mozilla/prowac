import { default as fetch } from 'node-fetch';

const probes = [];

function configure(opts) {
  const ret = [Promise.resolve()];

  opts.probes.forEach((probeOpts) => {
    if (!probeOpts.name) {
      return promise.reject(new Error('Probe without name encountered'));
    }

    const path = probeOpts.path || `./urlJobProcessorProbes/${probeOpts.name}.js`;
    const probeModule = require(path).default;

    if (!probeModule.runProbe) {
      return Promise.reject(new Error(`Probe ${probeOpts.name} does not implement runProbe`));
    }

    let p = Promise.resolve();
    if (probeModule.configure) {
      p = probeModule.configure(probeOpts.opts || {});
    }

    ret.push(p.then(() => {
      probes.push({
        name: probeOpts.name,
        probeFn: probeModule.runProbe,
      });
    }));
  });

  return Promise.all(ret);
}

function fetchAllResources(url) {
  const ret = { html: '', js: '', sw: '' };
  return fetch(`http://${url}`).then((response) => {
    return response.text().then((htmlText) => {
      ret.html += htmlText;
    });
  }).then(() => {
    // TODO: Fetch dependent resources (e.g. js, serviceWorker)
    // and store them in the fields of `ret`
    return Promise.resolve();
  }).then(() => {
    return ret;
  });
}

function processUrlJob(urlJob) {
  console.log(`[${Date.now()}] start - ${urlJob}`);

  const ret = {};

  return fetchAllResources(urlJob).then((pageResources) => {
    const promises = [];
    probes.forEach((probe) => {
      promises.push(probe.probeFn(pageResources).then((result) => {
        ret[probe.name] = result;
      }));
    });

    return Promise.all(promises);
  }).then(() => {
    console.log(`[${Date.now()}] finish - ${urlJob} - ${JSON.stringify(ret)}`);
    return ret;
  });
}

export default {
  configure,
  processUrlJob,
};
