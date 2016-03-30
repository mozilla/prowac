const names = {
  hasHTTPS: 'HTTPS',
  hasHTTPSRedirect: 'redirects to HTTPS',
  hasHSTS: 'HSTS',
  hasServiceWorker: 'service worker',
  hasManifest: 'web app manifest',
  hasPushSubscription: 'web push',
};

window.onload = () => {
  fetch('/aggregate?start=0&count=1')
  .then(response => response.json())
  .then(aggregated => {
    aggregated = aggregated[0];
    let label;
    const totalRecords = aggregated.totalRecords;
    console.log(totalRecords);
    delete aggregated.totalRecords;
    delete aggregated.timeStamp;
    const data = {
      labels: ['sites parsed'],
      datasets: [{
        fillColor: 'rgba(151,187,205,0.5)',
        strokeColor: 'rgba(151,187,205,0.8)',
        highlightFill: 'rgba(151,187,205,0.75)',
        highlightStroke: 'rgba(151,187,205,1)',
        data: [totalRecords],
      }],
    };
    for (label in aggregated) {
      if (aggregated.hasOwnProperty(label)) {
        data.labels.push(names[label]);
        data.datasets[0].data.push(aggregated[label]);
      }
    }
    console.log(data);
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx).Bar(data);
  });
};
