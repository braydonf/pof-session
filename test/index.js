'use strict';

var crypto = require('crypto');
var http = require('http');

var chai = require('chai');
var should = chai.should();

var Server = require('../server');

function request(method, path, cookie, nonce, callback) {
  var options = {
    hostname: 'localhost',
    port: 12345,
    path: path,
    method: method,
    headers: {}
  };
  if (cookie) {
    options.headers['cookie'] = cookie;
  }
  if (nonce) {
    options.headers['x-nonce'] = nonce;
  }
  var body = '';
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(null, res, body);
    });
  });
  req.on('error', function(e) {
    callback(e);
  });
  req.end();
}

function work(token, nonce, target, callback) {
  var hash = crypto.createHash('sha256').update(token + nonce).digest('hex');
  if (hash < target) {
    return callback(nonce);
  } else {
    setImmediate(function() {
      work(token, nonce + 1, target, callback);
    });
  }
}

describe('Proof-of-Work Session', function() {
  it('will give 402 status, and proof-of-work challenge', function(done) {
    var server = new Server({
      port: 12345
    });
    server.start(function() {
      request('GET', '/', false, false, function(err, res, body) {
        should.exist(res.headers['set-cookie']);
        res.statusCode.should.equal(402);
        var json = JSON.parse(body);
        json.algorithm.should.equal('sha256');
        json.target.should.equal('0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        json.token.length.should.equal(64);
        json.timeRemaining.should.equal(0);
        server.stop(done);
      });
    });
  });
  it('will give authorization to make api calls with proof-of-work', function(done) {
    this.timeout(30000);
    var server = new Server({
      port: 12345
    });
    server.start(function() {
      var cookie;
      request('GET', '/', false, false, function(err, res, body) {
        should.exist(res.headers['set-cookie']);
        cookie = res.headers['set-cookie'];

        var json = JSON.parse(body);
        work(json.token, 0, json.target, function(nonce) {
          request('GET', '/', cookie, nonce, function(err, res, body) {
            should.exist(res.headers['set-cookie']);
            res.statusCode.should.equal(200);
            body.should.equal('Hello, world!');
            server.stop(done);
          });
        });
      });
    });
  });
  it('will stop authorization once api time has been spent', function(done) {
    this.timeout(100000);
    var server = new Server({
      port: 12345
    });

    function drain(cookie, nonce, count, callback) {
      request('GET', '/', cookie, nonce, function(err, res, body) {
        should.exist(res.headers['set-cookie']);
        if (res.statusCode === 200) {
          body.should.equal('Hello, world!');
          count += 1;
          drain(cookie, nonce, count, callback);
        } else if (res.statusCode === 402) {
          callback(null, count);
        } else {
          callback(new Error('Unknown status code:' + res.statusCode));
        }
      });
    }

    server.start(function() {
      var cookie;
      request('GET', '/', false, false, function(err, res, body) {
        should.exist(res.headers['set-cookie']);
        cookie = res.headers['set-cookie'];

        var json = JSON.parse(body);
        work(json.token, 0, json.target, function(nonce) {
          drain(cookie, nonce, 0, function(err, count) {
            if (err) {
              return done(err);
            }
            count.should.equal(4);
            server.stop(done);
          });
        });
      });
    });
  });
});
