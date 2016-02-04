var assert = require('chai').assert;
import redis from '../db/redis.js';

describe('Redis', function() {
  describe('is installed', function () {
    it('should have environment prepared', function () {
      assert.ok(process.env.REDIS_URL);
    });

    it('should save and then retrieve value', function () {
      var client;
      return redis.getClient(5)
      .then(redisClient => {
        client = redisClient;
      })
      .then(() => redis.set(client, 'a', 'b'))
      .then(() => redis.get(client, 'a'))
      .then(result => {
        assert.equal(result, 'b');
      })
    });
  });
});

