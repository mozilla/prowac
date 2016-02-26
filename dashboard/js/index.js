window.setInterval(() => {
  fetch('/get-data').then((response) => {
    return response.json();
  }).then((json) => {
    document.write(JSON.stringify(json));
  });
}, 3000);
