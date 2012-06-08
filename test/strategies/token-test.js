var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var TokenStrategy = require('passport-http-oauth/strategies/token');


vows.describe('TokenStrategy').addBatch({
  
  'strategy': {
    topic: function() {
      return new TokenStrategy(function() {}, function() {});
    },
    
    'should be named oauth': function(strategy) {
      assert.equal(strategy.name, 'oauth');
    },
  },
  
  'strategy handling a valid request with credentials in header': {
    topic: function() {
      var strategy = new TokenStrategy(
        // consumer callback
        function(consumerKey, done) {
          done(null, { id: '1' }, 'keep-this-secret');
        },
        // verify callback
        function(accessToken, done) {
          done(null, { username: 'bob' }, { tokenSecret: 'lips-zipped' });
        }
      );
      return strategy;
    },
    
    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {};
        strategy.success = function(user, info) {
          self.callback(null, user, info);
        }
        strategy.fail = function(challenge, status) {
          self.callback(new Error('should not be called'));
        }
        strategy.error = function(err) {
          self.callback(new Error('should not be called'));
        }
        
        req.url = '/1/users/show.json?screen_name=jaredhanson&user_id=1705';
        req.method = 'GET';
        req.headers = {};
        req.headers['host'] = '127.0.0.1:3000';
        req.headers['authorization'] = 'OAuth oauth_consumer_key="1234",oauth_nonce="A7E738D9A9684A60A40607017735ADAD",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1339004912",oauth_token="abc-123-xyz-789",oauth_version="1.0",oauth_signature="TBrJJJWS896yWrbklSbhEd9MGQc%3D"';
        req.query = url.parse(req.url, true).query;
        req.connection = { encrypted: false };
        process.nextTick(function () {
          strategy.authenticate(req);
        });
      },
      
      'should not generate an error' : function(err, user, info) {
        assert.isNull(err);
      },
      'should authenticate' : function(err, user, info) {
        assert.equal(user.username, 'bob');
      },
    },
  },
  
  'strategy constructed without a consumer callback or verify callback': {
    'should throw an error': function (strategy) {
      assert.throws(function() { new TokenStrategy() });
    },
  },
  
  'strategy constructed without a verify callback': {
    'should throw an error': function (strategy) {
      assert.throws(function() { new TokenStrategy(function() {}) });
    },
  },
  
}).export(module);