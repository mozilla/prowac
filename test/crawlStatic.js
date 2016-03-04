import { assert } from 'chai';
// import { default as static } from '../crawler/urlJobPopulatorBackends/static.js';
import { default as dataStore } from '../dataStore/dataStore.js';
import { default as urlJobPopulator } from '../crawler/urlJobPopulator.js';
import 'mock-kue';
import { default as kue } from 'kue';
const queue = kue.createQueue();

function configureUrlJobPopulator(queueName, backendConfigOpts) {
  return urlJobPopulator.configure({
    backendName: 'static',
    progressCallback: urls => {
      const promises = [];
      urls.forEach(url => {
        promises.push(new Promise((resolve, reject) => {
          queue.create(queueName, { title: url })
          .attempts(5).backoff(true).save(err => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        }));
      });
      return Promise.all(promises);
    },
    finishedCallback: () => null,
    backendConfigOpts,
  });
}

describe('with using static urlJobPopulatorBackend', () => {
  context('urlJobPopulator.configure', () => {
    it('should fail if urls or json are provided', () => {
      return urlJobPopulator.configure({
        backendName: 'static',
        progressCallback: () => null,
        finishedCallback: () => null,
        backendConfigOpts: {},
      })
      .catch(err => {
        assert.ok(err);
      });
    });
  });
});

describe('with urls from command line', () => {
  before(() => dataStore.configure({ backendName: 'memory' }));

  context('populator backend', () => {
    beforeEach(() => kue.clear());

    it('should add 2 jobs to kue', function(done) {
      // do not show slow info
      this.slow(10000);
      return configureUrlJobPopulator('urls', { urls: 'google.com,wordpress.com' })
      .then(() => {
        urlJobPopulator.populate();
        setTimeout(() => {
          assert.equal(kue.jobCount(), 2);
          done();
        }, 500);
      });
    });
  });
});

describe('with JSON from command line', () => {
  before(() => dataStore.configure({ backendName: 'memory' }));

  context('populator backend', () => {
    beforeEach(() => kue.clear());

    it('should fail if no such file', () => {
      return configureUrlJobPopulator('json', { json: 'notexisting.json' })
      .catch(err => {
        assert.ok(err);
        assert.equal(err.message, "ENOENT: no such file or directory, open './notexisting.json'");
      });
    });

    it('should fail if empty JSON', () => {
      return configureUrlJobPopulator('json', { json: 'test/fixtures/empty.json' })
      .catch(err => {
        assert.ok(err);
        assert.equal(err, 'No urls in JSON file');
      });
    });

    it('should add 2 jobs to kue', function(done) {
      // do not show slow info
      this.slow(10000);
      return configureUrlJobPopulator('json', { json: 'test/fixtures/static.json' })
      .then(() => {
        urlJobPopulator.populate();
        setTimeout(() => {
          assert.equal(kue.jobCount(), 2);
          done();
        }, 1000);
      });
    });
  });
});
