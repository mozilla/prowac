const swRegexp = /\.serviceWorker\.register/;

function runProbe(responses, $, htmlText, scripts) {
  return new Promise((resolve, reject) => {
    scripts.forEach((script) => {
      if (swRegexp.test(script)) {
        return resolve(true);
      }
    });

    return resolve(false);
  });
}

export default {
  runProbe,
}
