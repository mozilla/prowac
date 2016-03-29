import { default as express } from 'express';
import { default as dataStore } from '../dataStore/dataStore.js';
import { default as kue } from 'kue';

const queue = kue.createQueue({ jobEvents: false });

// TODO: Configurable port
const port = 3001;

// TODO: Configure from a config file or env (should match crawler config)

dataStore.configure({
  backendName: 'redis',
  backendOpts: {
    url: 'redis://localhost:6379',
  },
}).then(() => {
  const app = express();
  app.get('/historical-url', getUrl);
  app.get('/aggregate', getAggregate);
  app.get('/recent', getRecent);
  app.use(express.static('dist/dashboard/static'));
  app.listen(port, () => {
    console.log(`Dashboard running on port ${port}`);
  });
});

function getAggregate(req, res) {
  const start = req.query.start;
  const count = req.query.count;

  console.log(`getAggregate ${start} ${count}`);
  dataStore.getHistoricalCrawlData(start, count).then((data) => {
    res.send(JSON.stringify(data));
  });
}

function getUrl(req, res) {
  const url = req.query.url;
  const count = req.query.count;

  console.log(`getUrl ${count} ${url}`);
  dataStore.getHistoricalURLData(url, count).then((data) => {
    res.send(JSON.stringify(data));
  });
}

const lastJobs = [];
queue.on('job complete', (id) => {
  kue.Job.get(id, (err, job) => {
    if (err) {
      return;
    }

    lastJobs.unshift(job);

    if (lastJobs.length > 10) {
      lastJobs.pop();
    }
  });
});

function getRecent(req, res) {
  console.log(`getRecent`);
  res.send(JSON.stringify(lastJobs));
}
