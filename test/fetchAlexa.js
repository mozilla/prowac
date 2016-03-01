import { assert } from 'chai';
import { test as alexa } from '../crawler/urlJobPopulatorBackends/alexa.js';
import { default as portfinder } from 'portfinder';
import { default as JSZip } from 'jszip';
import { default as http } from 'http';

describe('with a prepared content', () => {
  context('parseTop1M', () => {
    it('should return a list of 4 entries', () => {
      const content = '1,a\n2,b\n3,c\n4,d';
      return alexa.parseTop1M(content)
      .then(parsed => {
        assert.lengthOf(parsed, 4);
        // no need to keep the order
        assert.sameMembers(parsed, ['a', 'b', 'c', 'd']);
      });
    });
  });
});

describe('with a prepared zip file', () => {
  let closePromise;

  function getPort() {
    return new Promise((resolve, reject) => {
      portfinder.getPort((err, port) => {
        if (err) {
          return reject(err);
        }
        resolve(port);
      });
    });
  }

  function serveZip(port) {
    const zip = new JSZip();
    zip.file('top1m.csv', '\n1,google.com\n2,facebook.com\n3,youtube.com\n4,baidu.com');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/zip' });
      res.end(zip.generate({ type: 'nodebuffer' }));
      server.close();
    }).listen(port);

    closePromise = new Promise(resolve => {
      server.on('close', resolve);
    });

    return new Promise(resolve => {
      server.on('listening', resolve);
    });
  }

  afterEach(() => {
    if (closePromise) {
      return closePromise;
    }
  });

  context('getTop1M', () => {
    it('should return a csv with 4 lines', () => {
      return getPort()
      .then(port => serveZip(port)
        .then(() => alexa.getTop1M(`http://localhost:${port}`)))
      .then(csv => {
        assert.isOk(csv);
        assert.isString(csv);
        const lines = csv.split('\n');
        assert.lengthOf(lines, 4);
        assert.sameMembers(lines, ['1,google.com', '2,facebook.com', '3,youtube.com', '4,baidu.com']);
      });
    });
  });
});
