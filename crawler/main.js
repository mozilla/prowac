import { default as urlJobPopulator } from './urlJobPopulator.js';
import { default as urlJobProcessor } from './urlJobProcessor.js';
import { default as dataStore } from '../dataStore/dataStore.js';
import { default as kue } from 'kue';
import { default as cli } from 'cli.args';

// provide a json string using --json $filepath
// or url list in --urls comma separated list
const args = cli(['json:', 'urls:']);
let populatorBackendName = 'alexa';
if (args.json && args.urls) {
  throw new Error('--json argument can\'t be used together with --urls');
}
if (args.json || args.urls) {
  populatorBackendName = 'static';
}

// TODO: Clean up jobs
let addingNewJobs = false;
const queue = kue.createQueue({ jobEvents: false });

queue.on('error', (err) => {
  console.error(`UNCAUGHT ERROR: ${err}`);
});

function shutdown() {
  queue.shutdown(5000, (err) => {
    console.log('URL job queue shutdown initiated');
    if (err) {
      console.error(`Error shutting down Kue: ${err}`);
      return process.exit(1);
    }
    console.log('URL job queue shutdown complete');
    return process.exit(0);
  });
}

process.on('SIGINT', () => {
  shutdown();
});

queue.on('job complete', () => {
  if (addingNewJobs) {
    return;
  }

  const p1 = new Promise((resolve, reject) => {
    queue.inactiveCount((err, total) => {
      if (err) {
        return reject(err);
      }
      resolve(total);
    });
  });

  const p2 = new Promise((resolve, reject) => {
    queue.activeCount((err, total) => {
      if (err) {
        return reject(err);
      }
      resolve(total);
    });
  });

  Promise.all([p1, p2]).then((totals) => {
    if (totals[0] === 0 && totals[1] === 0) {
      console.log('FINISHED CRAWL');
      dataStore.finishCurrentCrawl().then(shutdown);
    }
  });
});

function populateJobs() {
  if (addingNewJobs) {
    return;
  }

  addingNewJobs = true;
  urlJobPopulator.populate();
}

function addJobs(urls) {
  // FIXME: This used to be a straight `urls.forEach` but with 1M+ urls that
  // was causing kue to run out of memory. This solution doesn't work super
  // well if the urlJobPopulator backend calls its progress callback very
  // frequently (e.g. once per url). We should take another look at this.

  let index = 0;
  function next() {
    if (index === urls.length) {
      return;
    }

    const url = urls[index];
    index++;

    // TODO: Configurable retry attempts
    queue.create('parse site', { title: url }).attempts(5).backoff(true).save((err) => {
      if (err) {
        console.error(`FAILED to add job: ${url}`);
        return;
      }

      next();
    });
  }

  next();
}

function startProcessingJobs() {
  // TODO: Configurable number of urls processing concurrently
  queue.process('parse site', 50, (job, done) => {
    urlJobProcessor.processUrlJob(job.data).then((result) => {
      return dataStore.updateWithCurrentCrawlResult(job.data.title, result).then(() => {
        done(null, result);
      });
    }).catch((err) => {
      done(err);
    });
  });
}

// TODO Configure from a config file

const configPromises = [];
const urlJopPopulatorOptions = {
  backendName: populatorBackendName,
  progressCallback: addJobs,
  finishedCallback: () => { addingNewJobs = false; },
};
if (args.json) {
  urlJopPopulatorOptions.backendConfigOpts = { json: args.json };
}
if (args.urls) {
  urlJopPopulatorOptions.backendConfigOpts = { urls: args.urls };
}

configPromises.push(urlJobPopulator.configure(urlJopPopulatorOptions));

configPromises.push(dataStore.configure({
  backendName: 'redis',
  backendOpts: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
}));

configPromises.push(urlJobProcessor.configure({
  // TODO: Something here
}));

Promise.all(configPromises).then(() => {
  queue.inactiveCount((err, total) => {
    if (err) {
      return console.error(`inactiveCount failure: ${err}`);
    }

    // FIXME: We need to also look at completeCount and failedCount
    if (total === 0) {
      console.log('No crawl in progress, starting new crawl');
      populateJobs();
    } else {
      console.log('Resuming previous crawl');
    }

    startProcessingJobs();
  });
}).catch((err) => {
  console.error(err);
  return process.exit(1);
});
