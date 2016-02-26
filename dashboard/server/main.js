import { default as express } from 'express';
import { default as dataStore } from '../dataStore/dataStore.js';

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
  dataStore.getHistoricalURLData('google.com', count).then((data) => {
    res.send(JSON.stringify(data));
  });
}
