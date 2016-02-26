import { default as fetch } from 'node-fetch';
import { default as cheerio } from 'cheerio';
import { default as urlModule } from 'url';

function configure() {
  // TODO: Add any necessary configuration here
  return Promise.resolve();
}

function processUrlJob(urlStr) {
  console.log(`[${Date.now()}] start - ${urlStr}`);

  const httpUrl = urlModule.parse(`http://${urlStr}`);
  const httpsUrl = urlModule.parse(`https://${urlStr}`);
  const ret = {
    hasHTTPS: false,
    hasHTTPSRedirect: false,
    hasHSTS: false,
    hasServiceWorker: false,
    hasManifest: false,
  };

  // TODO: Pass user agent in headers
  const fetchParams = {
    headers: '',
  };

  return fetch(httpUrl.href, fetchParams).catch(() => {
    // Ignore errors trying to fetch HTTP
    return null;
  }).then((httpResponse) => {
    if (httpResponse) {
      // Check the HTTP response for a W3C App Manifest
      return httpResponse.text().then((htmlText) => {
        const $ = cheerio.load(htmlText);
        $('link[rel="manifest"]').each(() => {
          ret.hasManifest = true;
          return false;
        });
      }).catch((err) => {
        // Log and ignore issues when parsing HTTP response
        console.error(`Unexpected error parsing HTTP response: ${err}`);
      }).then(() => {
        // Check whether we were redirected to HTTPS
        const responseUrl = urlModule.parse(httpResponse.url);
        if (responseUrl.protocol === 'https:') {
          ret.hasHTTPSRedirect = true;
          return httpResponse;
        }

        return null;
      });
    }
  }).then((httpsResponse) => {
    // If we already fetched over HTTPS thanks to an HTTP redirect
    // just keep the previous response. If not, we have to fetch over
    // HTTPS now.
    if (!httpsResponse) {
      return fetch(httpsUrl.href, fetchParams);
    }
    return httpsResponse;
  }).then((httpsResponse) => {
    ret.hasHTTPS = true;
    return httpsResponse.text();
  }).then((htmlText) => {
    const $ = cheerio.load(htmlText);

    // Check the HTTPS response for a W3C App Manifest
    $('link[rel="manifest"]').each(() => {
      ret.hasManifest = true;
      return false;
    });

    const scripts = [];
    const fetchPromises = [];
    $('script').each((index, elem) => {
      const src = $(elem).attr('src');
      if (!src) {
        scripts.push($(elem).text());
      } else {
        const resolvedSrc = urlModule.resolve(httpsUrl.href, src);
        fetchPromises.push(fetch(resolvedSrc).catch(() => {
          // Ignore errors trying to fetch individual scripts
        }).then((scriptResponse) => {
          return scriptResponse.text();
        }).then((jsText) => {
          return scripts.push(jsText);
        }));
      }
    });

    return Promise.all(fetchPromises).then(() => scripts);
  }).then((scripts) => {
    const swStr = '.serviceWorker';
    const regStr = '.register';

    scripts.forEach((script) => {
      if (script.indexOf(swStr) !== -1 && script.indexOf(regStr)) {
        ret.hasSW = true;
      }
    });
  }).catch((err) => {
    // Ignore errors. Specifically, errors trying to fetch over HTTPS will
    // end up in this block.
    console.log(`${urlStr} early exit thanks to ${err}`);
  }).then(() => {
    console.log(`[${Date.now()}] finish - ${urlStr} - ${JSON.stringify(ret)}`);
    return ret;
  });
}

export default {
  configure,
  processUrlJob,
};
