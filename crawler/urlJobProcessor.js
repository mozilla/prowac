import { default as fetch } from 'node-fetch';
import { default as cheerio } from 'cheerio';
import { default as urlModule } from 'url';

const probes = [];

function configure(opts) {
  if (!opts.probes || !opts.probes.length) {
    return Promise.reject(new Error('At least one urlJobProcessor probe must be specified'));
  }

  const ret = [Promise.resolve()];

  opts.probes.forEach((probeOpts) => {
    if (!probeOpts.name) {
      return Promise.reject(new Error('Probe without name encountered'));
    }

    // We allow the probe to be specified by name or by path. If specified by name,
    // we expect it to be a known subdir.
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

function fetchAllResources(urlArg) {
  const ret = { scripts: [] };
  const url = urlModule.parse(`http://${urlArg}`);

  // TODO: Pass user agent in headers
  return fetch(`${url.href}`, { headers: '' }).then((response) => {
    // We pass along the response object that was returned after
    // our fetch of the main page.
    ret.mainResponse = response;
    return response.text();
  }).then((htmlText) => {
    // We have to pass along the response body since it can no longer
    // be retrieved from the response.
    ret.mainResponseHtml = htmlText;

    const $ = cheerio.load(htmlText);
    const promises = [];
    $('script').each((index, elem) => {
      if (!$(elem).attr('src')) {
        // For inline scripts, just append them to the array of scripts
        // that we'll pass to the probes
        ret.scripts.push($(elem).text());
      } else {
        // For scripts with a `src` attribute, we must fetch them here
        let src = $(elem).attr('src');
        if (src[0] === '/') {
          // Deal with relative paths in `src` attributes
          src = `${url.protocol}//${url.host}${src}`;
        }
        promises.push(fetch(src).then((response) => {
          return response.text();
        }).then((jsText) => {
          return ret.scripts.push(jsText);
        }));
      }
    });

    return Promise.all(promises).then(() => {
      return ret;
    });
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
