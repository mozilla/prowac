import {assert} from 'chai';
import {default as db} from '../dist/db/db.js';

const backends = ['memory', 'redis'];

function addCrawl() {
  return db.updateWithCurrentCrawlResult('url1.com', {
    timestamp: new Date(),
    testProbe1: false,
    testProbe2: false,
    testProbe3: true,
    extraData: 'something here',
  }).then(() => {
    return db.updateWithCurrentCrawlResult('url2.com', {
      timestamp: new Date(),
      testProbe1: false,
      testProbe2: true,
      testProbe3: true,
      extraData: 'something else here',
    });
  }).then(() => {
    return db.updateWithCurrentCrawlResult('url3.com', {
      timestamp: new Date(),
      testProbe1: true,
      testProbe2: true,
      testProbe3: true,
      extraData: 'and another thing',
    });
  }).then(() => {
    return db.finishCurrentCrawl();
  });
}

function testGetHistoricalCrawlData(numInDB, startIndex, count) {
  return db.getHistoricalCrawlData(startIndex, count).then((data) => {
    assert.isArray(data);
    assert.strictEqual(data.length, Math.max(0, Math.min(numInDB - startIndex, count)));
    data.forEach((dataItem) => {
      assert.strictEqual(dataItem.totalRecords, 3);
      assert.strictEqual(dataItem.testProbe1, 1);
      assert.strictEqual(dataItem.testProbe2, 2);
      assert.strictEqual(dataItem.testProbe3, 3);
    });
  });
};

function testGetHistoricalURLData(numInDB, count) {
  return db.getHistoricalURLData('url1.com', count).then((data) => {
    assert.isArray(data);
    assert.strictEqual(data.length, Math.min(numInDB, count));
    data.forEach((dataItem) => {
      assert.strictEqual(dataItem.testProbe1, false);
      assert.strictEqual(dataItem.testProbe2, false);
      assert.strictEqual(dataItem.testProbe3, true);
    });
  }).then(() => {
    return db.getHistoricalURLData('url2.com', count).then((data) => {
      assert.isArray(data);
      assert.strictEqual(data.length, Math.min(numInDB, count));
      data.forEach((dataItem) => {
        assert.strictEqual(dataItem.testProbe1, false);
        assert.strictEqual(dataItem.testProbe2, true);
        assert.strictEqual(dataItem.testProbe3, true);
      });
    });
  }).then(() => {
    return db.getHistoricalURLData('url3.com', count).then((data) => {
      assert.isArray(data);
      assert.strictEqual(data.length, Math.min(numInDB, count));
      data.forEach((dataItem) => {
        assert.strictEqual(dataItem.testProbe1, true);
        assert.strictEqual(dataItem.testProbe2, true);
        assert.strictEqual(dataItem.testProbe3, true);
      });
    });
  });
}

backends.forEach((backendName) => {
  describe('DB with ' + backendName + ' backend', () => {
    before(() => {
      db.setBackend(backendName);
    });

    context('storing and retrieving URLs', () => {
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

    context('with 0 completed crawls', () => {
      context('getHistoricalCrawlData', () => {
        it('should return empty list', () => {
          return testGetHistoricalCrawlData(0, 0, 1).then(() => {
            return testGetHistoricalCrawlData(0, 0, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(0, 5, 1);
          });
        });
      });

      context('getHistoricalURLData', () => {
        it('should return empty list', () => {
          return testGetHistoricalURLData(0, 1).then(() => {
            return testGetHistoricalURLData(0, 10);
          });
        });
      });
    });

    context('with 1 completed crawl', () => {
      before(() => {
        return addCrawl();
      });

      context('getHistoricalCrawlData', () => {
        it('should return items in range', () => {
          return testGetHistoricalCrawlData(1, 0, 1).then(() => {
            return testGetHistoricalCrawlData(1, 1, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(1, 2, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(1, 0, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(1, 1, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(1, 2, 10);
          });
        });
      });

      context('getHistoricalURLData', () => {
        it('should return items available and requested', () => {
          return testGetHistoricalURLData(1, 1).then(() => {
            return testGetHistoricalURLData(1, 10);
          });
        });
      });
    });

    context('with 7 completed crawls', () => {
      before(() => {
        return addCrawl().then(() => {
          return addCrawl();
        }).then(() => {
          return addCrawl();
        }).then(() => {
          return addCrawl();
        }).then(() => {
          return addCrawl();
        }).then(() => {
          return addCrawl();
        });
      });

      context('getHistoricalCrawlData', () => {
        it('should return items in range', () => {
          return testGetHistoricalCrawlData(7, 0, 1).then(() => {
            return testGetHistoricalCrawlData(7, 1, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 2, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 3, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 4, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 5, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 6, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 7, 1);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 0, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 1, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 2, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 3, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 4, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 5, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 6, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 7, 4);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 0, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 1, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 2, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 3, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 4, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 5, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 6, 10);
          }).then(() => {
            return testGetHistoricalCrawlData(7, 7, 10);
          });
        });
      });

      context('getHistoricalURLData', () => {
        it('should return items available and requested', () => {
          return testGetHistoricalURLData(7, 1).then(() => {
            return testGetHistoricalURLData(7, 2);
          }).then(() => {
            return testGetHistoricalURLData(7, 3);
          }).then(() => {
            return testGetHistoricalURLData(7, 4);
          }).then(() => {
            return testGetHistoricalURLData(7, 5);
          }).then(() => {
            return testGetHistoricalURLData(7, 6);
          }).then(() => {
            return testGetHistoricalURLData(7, 7);
          }).then(() => {
            return testGetHistoricalURLData(7, 8);
          });
        });
      });
    });
  });
});
