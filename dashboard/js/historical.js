const urlInput = document.querySelector('#url-input');
const urlCountInput = document.querySelector('#url-count-input');
const urlButton = document.querySelector('#historical-url-button');

const aggregateStartInput = document.querySelector('#aggregate-start-input');
const aggregateCountInput = document.querySelector('#aggregate-count-input');
const aggregateButton = document.querySelector('#aggregate-button');

const output = document.querySelector('#out');

const lastJobs = document.querySelector('#lastJobs');

urlButton.addEventListener('click', (event) => {
  event.preventDefault();

  const url = urlInput.value;
  const count = parseInt(urlCountInput.value, 10);

  fetch(`/historical-url?url=${url}&count=${count}`).then((response) => {
    return response.json();
  }).then((json) => {
    output.textContent = JSON.stringify(json);
  });
});

aggregateButton.addEventListener('click', (event) => {
  event.preventDefault();

  const start = parseInt(aggregateStartInput.value, 10);
  const count = parseInt(aggregateCountInput.value, 10);

  fetch(`/aggregate?start=${start}&count=${count}`).then((response) => {
    return response.json();
  }).then((json) => {
    output.textContent = JSON.stringify(json);
  });
});

window.setInterval(() => {
  fetch(`/recent`).then((response) => {
    return response.json();
  }).then((json) => {
    lastJobs.textContent = JSON.stringify(json);
  });
}, 5000);
