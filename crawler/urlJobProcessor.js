import { default as fetch } from 'node-fetch';
import { default as cheerio } from 'cheerio';
import { default as urlModule } from 'url';

function configure() {
  // TODO: Add any necessary configuration here
  return Promise.resolve();
}

function processUrlJob(data) {
  const urlStr = data.title;
  console.log(`[${Date.now()}] start - ${urlStr}`);

  const httpUrl = urlModule.parse(`http://${urlStr}`);
  const httpsUrl = urlModule.parse(`https://${urlStr}`);
  const ret = {
    hasHTTPS: false,
    hasHTTPSRedirect: false,
    hasHSTS: false,
    hasServiceWorker: false,
    hasManifest: false,
    hasPushSubscription: false,
  };

  // TODO: Pass user agent in headers
  const fetchParams = {
    headers: '',
  };

  return fetch(httpUrl.href, fetchParams).catch(() => {
    // Ignore errors trying to fetch HTTP
    return null;
  })
  .then((httpResponse) => {
    if (httpResponse) {
      // Check whether we were redirected to HTTPS
      const responseUrl = urlModule.parse(httpResponse.url);
      if (responseUrl.protocol === 'https:') {
        ret.hasHTTPSRedirect = true;
        return httpResponse;
      }
    }
  })
  .then((httpsResponse) => {
    // If we already fetched over HTTPS thanks to an HTTP redirect
    // just keep the previous response. If not, we have to fetch over
    // HTTPS now.
    if (!httpsResponse) {
      return fetch(httpsUrl.href, fetchParams);
    }
    return httpsResponse;
  })
  .then((httpsResponse) => {
    if (httpsResponse.headers.has('Strict-Transport-Security')) {
      ret.hasHSTS = true;
    }
    ret.hasHTTPS = true;
    return httpsResponse.text();
  })
  .then((htmlText) => {
    const $ = cheerio.load(htmlText);
    const fetchPromises = [];

    // Check the HTTPS response for a W3C App Manifest
    $('link[rel="manifest"]').each((index, elem) => {
      ret.hasManifest = true;
      const href = $(elem).attr('href');
      const resolvedSrc = urlModule.resolve(httpsUrl.href, href);
      fetchPromises.push(
        fetch(resolvedSrc)
          .catch(() => {
            // Ignore errors trying to fetch individual scripts
          })
          .then((manifestResponse) => {
            return manifestResponse.json();
          })
          .then((manifest) => {
            if (manifest.gcm_sender_id) {
              ret.hasPushSubscription = true;
            }
          })
      );
    });

    const scripts = [];
    $('script').each((index, elem) => {
      const src = $(elem).attr('src');
      if (!src) {
        scripts.push($(elem).text());
      } else {
        const resolvedSrc = urlModule.resolve(httpsUrl.href, src);
        fetchPromises.push(
          fetch(resolvedSrc).catch(() => {
            console.warn('Could not fetch script %s', resolvedSrc);
            // Ignore errors trying to fetch individual scripts
          })
          .then((scriptResponse) => {
            return scriptResponse.text();
          })
          .then((jsText) => {
            return scripts.push(jsText);
          })
        );
      }
    });

    return Promise.all(fetchPromises)
      .then(() => scripts);
  })
  .then((scripts) => {
    console.log('Checking %d scripts', scripts.length);
    const swStr = '.serviceWorker';
    const regStr = '.register(';
    const pushStr = '.pushManager';
    const subscribeStr = '.subscribe(';

    scripts.forEach((script) => {
      if (script.indexOf(swStr) !== -1 && script.indexOf(regStr) !== -1) {
        ret.hasServiceWorker = true;
      }
      if (script.indexOf(pushStr) !== -1 && script.indexOf(subscribeStr) !== -1) {
        ret.hasPushSubscription = true;
      }
    });
  })
  .catch((err) => {
    // Ignore errors. Specifically, errors trying to fetch over HTTPS will
    // end up in this block.
    console.log(`${urlStr} early exit`);
    console.log(err);
  })
  .then(() => {
    console.log(`[${Date.now()}] finish - ${urlStr} - ${JSON.stringify(ret)}`);
    return ret;
  });
}

export default {
  configure,
  processUrlJob,
};
