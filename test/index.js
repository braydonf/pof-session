'use strict';

var http = require('http');

var chai = require('chai');
var should = chai.should();

var Server = require('../server');

describe('Proof-of-Work Session', function() {
  it('will give 402 status, and proof-of-work challenge', function(done) {
    var server = new Server({
      port: 12345
    });
    server.start(function() {

      var options = {
        hostname: 'localhost',
        port: 12345,
        path: '/',
        method: 'GET'
      };

      var body = '';

      var req = http.request(options, function(res) {
        res.statusCode.should.equal(402);
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          body += chunk;
        });
        res.on('end', function() {
          var json = JSON.parse(body);
          json.algorithm.should.equal('sha256');
          json.params.should.deep.equal({target: '0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'});
          json.token.length.should.equal(64);
          done();
        });
      });

      req.on('error', function(e) {
        done(e);
      });
      req.end();
    });
  });
  it('will give authorization to make api calls with token', function() {
  });
  it('will stop authorization once api time has been spent', function() {
  });
});
