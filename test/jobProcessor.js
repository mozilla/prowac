import { assert } from 'chai';
import { default as urlJobProcessor } from '../crawler/urlJobProcessor.js';
import { default as nock } from 'nock';

let probes;

describe('processUrlJob for a site', () => {
  beforeEach(() => {
    probes = {
      hasHTTPS: false,
      hasHSTS: false,
      hasHTTPSRedirect: false,
      hasManifest: false,
      hasServiceWorker: false,
      hasPushSubscription: false,
    };
  });

  afterEach(() => {
    nock.cleanAll();
  });

  context('responding 404 to http and no https', () => {
    it('should fail on all probes', () => {
      const site = nock('http://localhost:8000')
      .get('/')
      .reply(404);

      return urlJobProcessor.processUrlJob('localhost:8000')
      .then(ret => {
        assert.ok(site.isDone());
        assert.deepEqual(ret, probes);
      });
    });
  });

  context('has no https', () => {
    it('should fail on all probes', () => {
      const site = nock('http://localhost:8000')
      .get('/')
      .reply(200, '<html></html>');

      return urlJobProcessor.processUrlJob('localhost:8000')
      .then(ret => {
        assert.ok(site.isDone());
        assert.deepEqual(ret, probes);
      });
    });
  });

  context('with http and https response', () => {
    it('should pass hasHTTPS', () => {
      nock('http://localhost')
      .get('/')
      .reply(200, '<html></html>');

      const site = nock('http://localhost:443')
      .get('/')
      .reply(200, '<html></html>');

      return urlJobProcessor.processUrlJob('localhost')
      .then(ret => {
        assert.ok(site.isDone());
        probes.hasHTTPS = true;
        assert.deepEqual(ret, probes);
      });
    });
  });

  context('with manifest in http response but not in https one', () => {
    it('should pass hasHTTPS', () => {
      nock('http://localhost')
      .get('/')
      .reply(200, '<html><link rel="manifest"></html>');

      const site = nock('http://localhost:443')
      .get('/')
      .reply(200, '<html></html>');

      return urlJobProcessor.processUrlJob('localhost')
      .then(ret => {
        assert.ok(site.isDone());
        probes.hasHTTPS = true;
        probes.hasManifest = true;
        assert.deepEqual(ret, probes);
      });
    });
  });

  context('with manifest in https response', () => {
    it('should pass hasHTTPS', () => {
      nock('http://localhost')
      .get('/')
      .reply(200, '<html></html>');

      const site = nock('http://localhost:443')
      .get('/')
      .reply(200, '<html><link rel="manifest"></html>');

      return urlJobProcessor.processUrlJob('localhost')
      .then(ret => {
        assert.ok(site.isDone());
        probes.hasHTTPS = true;
        probes.hasManifest = true;
        assert.deepEqual(ret, probes);
      });
    });
  });

  context('with service worker registration', () => {
    it('should pass hasServiceWorker', () => {
      nock('http://localhost')
      .get('/')
      .reply(200, '<html></html>');

      const site = nock('http://localhost:443')
      .get('/')
      .reply(200, '<html><script src="https://localhost/index.js"></html>')
      .get('/index.js')
      .reply(200, 'navigator.serviceWorker.register(\'sw.js\');');

      return urlJobProcessor.processUrlJob('localhost')
      .then(ret => {
        assert.ok(site.isDone());
        probes.hasHTTPS = true;
        probes.hasServiceWorker = true;
        assert.deepEqual(ret, probes);
      });
    });
  });

  context('with push subscription', () => {
    it('should pass hasPushSubscription', () => {
      nock('http://localhost')
      .get('/')
      .reply(200, '<html></html>');

      const site = nock('http://localhost:443')
      .get('/')
      .reply(200, '<html><script src="https://localhost/index.js"></html>')
      .get('/index.js')
      .reply(200, 'registration.pushManager.subscribe();');

      return urlJobProcessor.processUrlJob('localhost')
      .then(ret => {
        assert.ok(site.isDone());
        probes.hasHTTPS = true;
        probes.hasPushSubscription = true;
        assert.deepEqual(ret, probes);
      });
    });
  });
});
