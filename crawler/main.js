import { default as urlJobPopulator } from './urlJobPopulator.js';
import { default as urlJobProcessor } from './urlJobProcessor.js';
import { default as dataStore } from '../dataStore/dataStore.js';
import { default as kue } from 'kue';

// TODO: Clean up jobs

let addingNewJobs = false;
const queue = kue.createQueue({ jobEvents: false });

queue.on('error', (err) => {
  console.error(`UNCAUGHT ERROR: ${err}`);
});

process.on('SIGINT', () => {
  queue.shutdown(5000, (err) => {
    console.log('URL job queue shutdown initiated');
    if (err) {
      console.error(`Error shutting down Kue: ${err}`);
      return process.exit(1);
    }
    console.log('URL job queue shutdown complete');
    return process.exit(0);
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
    queue.create('url', url).attempts(5).backoff(true).save((err) => {
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
  queue.process('url', 50, (job, done) => {
    urlJobProcessor.processUrlJob(job.data).then((result) => {
      return dataStore.updateWithCurrentCrawlResult(result).then(() => {
        done(null, result);
      });
    }).catch((err) => {
      done(err);
    });
  });
}

// TODO: Configure from a config file (dataStore config should match
// the config that dashboard uses)
const configPromises = [];

configPromises.push(urlJobPopulator.configure({
  backendName: 'alexa',
  progressCallback: addJobs,
  finishedCallback: () => { addingNewJobs = false; },
}));

configPromises.push(dataStore.configure({
  backendName: 'redis',
  backendOpts: {
    url: 'redis://localhost:6379',
  },
}));

configPromises.push(urlJobProcessor.configure({

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
