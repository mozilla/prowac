function runProbe(responses, $, htmlText, scripts) {
  let ret = false;

  $('link[rel="manifest"]').each((index, elem) => {
    ret = true;
  });

  return Promise.resolve(ret);
}

export default {
  runProbe,
}
