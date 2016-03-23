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

const options = {
  // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
  scaleBeginAtZero: true,

  // Boolean - Whether grid lines are shown across the chart
  scaleShowGridLines: true,

  // String - Colour of the grid lines
  scaleGridLineColor: 'rgba(0,0,0,.05)',

  // Number - Width of the grid lines
  scaleGridLineWidth: 1,

  // Boolean - Whether to show horizontal lines (except X axis)
  scaleShowHorizontalLines: true,

  // Boolean - Whether to show vertical lines (except Y axis)
  scaleShowVerticalLines: true,

  // Boolean - If there is a stroke on each bar
  barShowStroke: true,

  // Number - Pixel width of the bar stroke
  barStrokeWidth: 2,

  // Number - Spacing between each of the X value sets
  barValueSpacing: 5,

  // Number - Spacing between data sets within X values
  barDatasetSpacing: 1,

  // String - A legend template
  legendTemplate: '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>',
};

const data = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'My First dataset',
      fillColor: 'rgba(220,220,220,0.5)',
      strokeColor: 'rgba(220,220,220,0.8)',
      highlightFill: 'rgba(220,220,220,0.75)',
      highlightStroke: 'rgba(220,220,220,1)',
      data: [65, 59, 80, 81, 56, 55, 40],
    },
    {
      label: 'My Second dataset',
      fillColor: 'rgba(151,187,205,0.5)',
      strokeColor: 'rgba(151,187,205,0.8)',
      highlightFill: 'rgba(151,187,205,0.75)',
      highlightStroke: 'rgba(151,187,205,1)',
      data: [28, 48, 40, 19, 86, 27, 90],
    },
  ],
};

window.onload = () => {
  const ctx = document.getElementById('myChart').getContext('2d');
  const myBarChart = new Chart(ctx).Bar(data, options);
  console.log(myBarChart);
};
