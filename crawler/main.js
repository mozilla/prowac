import {default as urlJobPopulator} from '../urlJobPopulator/urlJobPopulator.js';
import {default as dataStore} from '../dataStore/dataStore';
import {default as urlJobProcessor} from '../urlJobProcessor/urlJobProcessor.js';
import {default as kue} from 'kue';

// TODO: Clean up jobs

let addingNewJobs = false;
const queue = kue.createQueue({jobEvents: false});

queue.on('error', (err) => {
  console.error('UNCAUGHT ERROR: ' + err);
});

process.on('SIGINT', () => {
  queue.shutdown(5000, (err) => {
    console.log('URL job queue shutdown initiated');
    if (err) {
      console.error('Error shutting down Kue: ' + err);
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
  urlJobPopulator.setProgressCallback(addJobs);
  urlJobPopulator.setFinishedCallback(() => { addingNewJobs = false; });
  urlJobPopulator.populate();
}

function addJobs(urls) {
  urls.forEach((url) => {
    // TODO: Configurable retry attempts
    queue.create('url', url).attempts(5).backoff(true).save((err) => {
      if (err) {
        console.error('FAILED to add job: ' + url);
      }
    });
  });
}

function startProcessingJobs() {
  return new Promise((resolve, reject) => {
    // TODO: Configurable number of urls processing concurrently
    queue.process('url', 50, (job, done) => {
      urlJobProcessor.process(job.data).then((result) => {
        return urlStore.updateWithCurrentCrawlResult(result).then(() => {
          done(null, result);
        });
      }).catch((err) => {
        done(err);
      });
    });
  });
}

queue.inactiveCount((err, total) => {
  if (err) {
    return console.error('inactiveCount failure: ' + err);
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
