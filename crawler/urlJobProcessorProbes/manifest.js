function runProbe(siteData) {
  const $ = siteData.dom;

  let ret = false;

  $('link[rel="manifest"]').each((index, elem) => {
    ret = true;
  });

  return Promise.resolve(ret);
}

export default {
  runProbe,
}
