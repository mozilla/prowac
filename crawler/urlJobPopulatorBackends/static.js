import { default as fs } from 'fs';

let list;
let currentIndex = 0;
let intervalID;

// read JSON file and return a promise after it's done
// save the list in list variable
function parseJSONList(fileName) {
  let obj;
  let filePath = `./${fileName}`;
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) {
        return reject(err);
      }
      obj = JSON.parse(data);
      if (!obj.urls) {
        return reject('No urls in JSON file');
      }
      list = obj.urls;
      resolve();
    });
  });
}

function configure(opts) {
  if (opts.urls) {
    list = opts.urls.split(',');
    return Promise.resolve();
  }
  if (opts.json) {
    return parseJSONList(opts.json);
  }
  return Promise.reject();
}

function actuallyPopulate(progressCallback, finishedCallback) {
  const ret = [];
  if (currentIndex === list.length) {
    clearInterval(intervalID);
    // reset index - important for testing when we run the function
    // several times
    currentIndex = 0;
    return finishedCallback();
  }
  ret.push(list[currentIndex++]);
  if (currentIndex === list.length) {
    return progressCallback(ret);
  }
  ret.push(list[currentIndex++]);
  return progressCallback(ret);
}

function populate(progressCallback, finishedCallback) {
  intervalID = setInterval(actuallyPopulate.bind(null, progressCallback, finishedCallback), 100);
}

export default {
  configure,
  populate,
};
