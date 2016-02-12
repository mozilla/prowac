import { default as fetch } from 'node-fetch';

const probes = [];

function configure(/* opts */) {
  // TODO: Set up probes. They'll be specified somehow in opts and we
  // should be able to load each probe individually. Maybe something
  // like `require('./probe-' + probeName + '.js');`
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
  console.log(`processUrlJob - ${urlJob}`);

  return fetchAllResources(urlJob).then((pageResources) => {
    const promises = [];
    probes.forEach((probeFunc) => {
      promises.push(probeFunc.apply(null, pageResources));
    });
  });
}

export default {
  configure,
  processUrlJob,
};
