// fetches all required resources from url, builds an Object and returns
// a promise
function processUrlJob(urlJob) {
  // XXX write this part
  console.log('processUrlJob - ' + urlJob);
  return Promise.resolve({
    hasProbe1: false,
    hasProbe2: false,
    hasProbe3: true,
  });
}

export default {
  processUrlJob,
};
