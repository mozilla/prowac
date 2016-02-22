import { default as JSZip } from 'jszip';
import { default as dataStore } from '../dataStore/dataStore.js';

function getTop1M(zipURL) {
  const request = new Request(zipURL);
  return fetch(request)
  .then(response => response.blob())
  .then(file => {
    const zip = new JSZip(file);
    return zip.file('top1m.csv').asText();
  });
}

function parseTop1M(csv) {
  const content = csv.split('\n');
  return Promise.resolve(content.map(row => row.split(',')[1]));
}

function saveTop1M(urls) {
  return dataStore.saveUrls(urls);
}

function fetchTop1M(zipURL) {
  if (!zipURL) {
    zipURL = 'http://s3.amazonaws.com/alexa-static/top-1m.csv.zip';
  }
  return getTop1M(zipURL)
  .then(parseTop1M)
  .then(saveTop1M);
}

export default {
  getTop1M,
  parseTop1M,
  saveTop1M,
  fetchTop1M,
};
