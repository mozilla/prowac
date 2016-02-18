import { default as fetch } from 'node-fetch';
import { default as cheerio } from 'cheerio';
import { default as urlModule } from 'url';

const probes = [];

function configure(opts) {
  const ret = [Promise.resolve()];

  opts.probes.forEach((probeOpts) => {
    if (!probeOpts.name) {
      return Promise.reject(new Error('Probe without name encountered'));
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

function fetchAllResources(urlArg) {
  const ret = { scripts: [] };
  const urlStr = `http://${urlArg}`;
  const url = urlModule.parse(urlStr);

  return fetch(`${url.href}`, { headers: '' }).then((response) => {
    ret.mainResponse = response;
    return response.text();
  }).then((htmlText) => {
    ret.mainResponseHtml = htmlText;
    const $ = cheerio.load(htmlText);
    const promises = [];
    $('script').each((index, elem) => {
      if (!$(elem).attr('src')) {
        ret.scripts.push($(elem).text());
      } else {
        let src = $(elem).attr('src');
        if (src[0] === '/') {
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
