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
  const url = urlModule.parse(`http://${urlArg}`);

  // TODO: Pass user agent in headers
  return fetch(`${url.href}`, { headers: '' }).then((mainResponse) => {
    // We pass along the response object that was returned after
    // our fetch of the main page. As an optimization, we don't
    // clone the response here. Instead, we pass the body text
    // in a separate arg.
    const responses = [mainResponse];
    return mainResponse.text().then((htmlText) => {
      const $ = cheerio.load(htmlText);
      const scripts = [];
      const promises = [];

      $('script').each((index, elem) => {
        const src = $(elem).attr('src');
        if (!src) {
          // For inline scripts, just append them to the array of scripts
          // that we'll pass to the probes
          scripts.push($(elem).text());
        } else {
          // For scripts with a `src` attribute, we must fetch them here
          const resolvedSrc = urlModule.resolve(url.href, src);
          promises.push(fetch(resolvedSrc).then((scriptResponse) => {
            return scriptResponse.text();
          }).then((jsText) => {
            return scripts.push(jsText);
          }));
        }
      });

      return Promise.all(promises).then(() => {
        return { responses, dom: $, htmlText, scripts };
      });
    });
  });
}

function processUrlJob(urlJob) {
  console.log(`[${Date.now()}] start - ${urlJob}`);

  const ret = {};

  return fetchAllResources(urlJob).then((pageResources) => {
    const promises = probes.map((probe) => {
      return probe.probeFn.call(null, pageResources).then((result) => {
        ret[probe.name] = result;
      });
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
