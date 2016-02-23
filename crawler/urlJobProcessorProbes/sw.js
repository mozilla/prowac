const swRegexp = /\.serviceWorker/;
const regRegexp = /\.register/;

let swMatched = false;
let regMatched = false;

function runProbe(pageResources) {
  const scripts = pageResources.scripts;

  return new Promise((resolve, reject) => {
    scripts.forEach((script) => {
      if (swRegexp.test(script)) {
        swMatched = true;
        if (regMatched) {
          return resolve(true);
        }
      }

      if (regRegexp.test(script)) {
        regMatched = true;
        if (swMatched) {
          return resolve(true);
        }
      }
    });

    return resolve(false);
  });
}

export default {
  runProbe,
}
