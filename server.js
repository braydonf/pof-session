'use strict';

var assert = require('assert');
var crypto = require('crypto');

var express = require('express');
var onHeaders = require('on-headers');

function Server(options) {
  if (!(this instanceof Server)) {
    return new Server(options);
  }
  this.app = null;
  this.port = options.port || Server.DEFAULT_PORT;
}

Server.DEFAULT_PORT = 8080;

Server.prototype.requestWork = function(req, res) {
  this.createToken(function(err, token) {
    if (err) {
      // TODO
    }
    res.status(402).jsonp({
      algorithm: 'sha256',
      params: {
        target: '0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      },
      token: token
    });
  });
};

Server.prototype.createToken = function(callback) {
  var token = crypto.randomBytes(32).toString('hex');
  callback(null, token);
};

Server.prototype.getTimeRemaining = function() {

};

Server.prototype.spendTime = function(token, time) {

};

Server.prototype.workRequired = function() {
  var self = this;
  return function(req, res, next) {
    if (!req.header('authorization')) {
      self.requestWork(req, res);
    } else {
      req._startAt = process.hrtime();
      var token = req.header('authorization');

      self.getTimeRemaining(token, function(err, timeRemaining) {
        if (!timeRemaining) {
          self.requestWork(req, res);
        } else {
          onHeaders(res, function() {
            self.spendTime(token, process.hrtime(req._startAt));
          });
          next();
        }
      });
    }
  };
};

Server.prototype.connectDatabase = function(callback) {
  callback();
};

Server.prototype.closeDatabase = function(callback) {
  callback();
};

Server.prototype.start = function() {
  var self = this;

  self.app = express();

  self.app.get('/', this.workRequired(), function (req, res) {
    setTimeout(function() {
      res.send('Hello, world!');
    }, 2000);
  });


  self.connectDatabase(function(err) {
    if (err) {
      return console.log('Unable to open database', err);
    }
    self.app.listen(this.port, function () {
      console.log('App listening on port', self.port);
    });
  });

};

if (require.main === module) {
  var options = {};
  if (process.argv[2]) {
    options = JSON.parse(process.argv[2]);
  }
  var server = new Server(options);
  server.start();
}

module.exports = Server;
