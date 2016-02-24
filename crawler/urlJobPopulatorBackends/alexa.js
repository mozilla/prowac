import { default as JSZip } from 'jszip';
import { default as fetch } from 'node-fetch';

function configure(opts) {
  return Promise.resolve();
}

function getTop1M(zipURL) {
  console.log(`fetch ${zipURL}`);
  return fetch(zipURL)
  .then((response) => {
    console.log(`got response: ${response}`);
    return response.body;
  })
  .then((stream) => {
    return new Promise((resolve, reject) => {
      let ret = new Buffer(0);
      let length = 0;

      stream.on('readable', function onReadable() {
        let chunk = stream.read();
        if (null === chunk) {
          stream.removeListener('readable', onReadable);
          return resolve(ret);
        }

        length += chunk.length;
        ret = Buffer.concat([ret, chunk], length);
      });
    });
  })
  .then((file) => {
    console.log(`Got file, length: ${file.length}`);
    const zip = new JSZip(file);
    console.log(`Loaded zip file`);
    return zip.file('top-1m.csv').asText();
  });
}

function parseTop1M(csv) {
  console.log('Parsing Alexa top 1M data');
  const content = csv.split('\n');
  return Promise.resolve(content.map(row => row.split(',')[1]));
}

function fetchTop1M(zipURL) {
  if (!zipURL) {
    zipURL = 'http://s3.amazonaws.com/alexa-static/top-1m.csv.zip';
  }
  return getTop1M(zipURL)
  .then(parseTop1M);
}

function populate(progressCallback, finishedCallback) {
  fetchTop1M().then((data) => {
    console.log('Successfully unzipped and parsed Alexa top 1M data');
    progressCallback(data);
    finishedCallback();
  })
  .catch((err) => {
    console.error(`Fail: ${err}`);
  });
}

export default {
  configure,
  populate,
};

export const test = {
  getTop1M,
  parseTop1M,
};
