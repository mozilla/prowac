import {default as fetch} from 'node-fetch';

let probes = [];

function configure(opts) {

}

function fetchAllResources(url) {
  let ret = { html: '', js: '', sw: '' };
  return fetch(url).then((response) => {
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
  console.log('processUrlJob - ' + urlJob);

  return fetchAllResources(urlJob.url).then((pageResources) => {
    let promises = [];
    probes.forEach((probeFunc) => {
      promises.push(probeFunc.apply(null, pageResources));
    });
  });
}

export default {
  configure,
  processUrlJob,
};
