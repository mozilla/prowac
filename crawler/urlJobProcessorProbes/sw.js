const swRegexp = /\.serviceWorker\.register/;

function runProbe(data) {
  return new Promise((resolve, reject) => {
    data.scripts.forEach((script) => {
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
