function runProbe(responses, $, htmlText, scripts) {
  let ret = false;

  $('link').each((index, elem) => {
    const rel = $(elem).attr('rel').trim().toLowerCase();
    if (rel === 'manifest') {
      ret = true;
      return false;
    }
  });

  return Promise.resolve(ret);
}

export default {
  runProbe,
}
