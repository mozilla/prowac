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
  app.get('/get-data', getData);
  app.use(express.static('dist/dashboard/static'));
  app.listen(port, () => {
    console.log(`Dashboard running on port ${port}`);
  });
});

function getData(req, res) {
  console.log(`getData, req=${req}`);
  dataStore.getHistoricalURLData('google.com', 10).then((data) => {
    res.send(JSON.stringify(data));
  });
}
