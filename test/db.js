import {assert} from 'chai';
import {default as db} from '../dist/db/db.js';

const backends = ['memory', 'redis'];

backends.forEach((backendName) => {
  describe('DB with ' + backendName + ' backend', () => {
    before(() => {
      db.setBackend(backendName);
    });

    context('URLs', () => {
      it('should reject when list is empty', () => {
        let rejected = false;
        let resolved = false;
        return db.popURL().then(() => {
          resolved = true;
        }).catch(() => {
          rejected = true;
        }).then(() => {
          assert(!resolved, 'Promise resolved when it should have rejected');
          assert(rejected, 'Promise did not reject as expected');
        });
      });

      it('should push and pop in expected order', () => {
        return db.pushURLs(['url1.com', 'url2.com', 'url3.com']).then(() => {
          return db.popURL();
        }).then((url3) => {
          assert.strictEqual(url3, 'url3.com');
        }).then(() => {
          return db.popURL();
        }).then((url2) => {
          assert.strictEqual(url2, 'url2.com');
        }).then(() => {
          return db.popURL();
        }).then((url1) => {
          assert.strictEqual(url1, 'url1.com');
        });
      });
    });
  });
});
