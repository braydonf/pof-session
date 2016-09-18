'use strict';

var assert = require('assert');
var crypto = require('crypto');

var express = require('express');
var session = require('express-session');
var onHeaders = require('on-headers');

function Server(options) {
  if (!(this instanceof Server)) {
    return new Server(options);
  }
  this.app = null;
  this.port = options.port || Server.DEFAULT_PORT;
}

Server.DEFAULT_PORT = 8080;
Server.DEFAULT_TIME = 30000;
Server.DEFAULT_TARGET = '0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

Server.prototype.sha256 = function(token, nonce) {
  return crypto.createHash('sha256').update(token + nonce).digest('hex');
};

Server.prototype.requestWork = function(req, res) {
  var token = crypto.randomBytes(32).toString('hex');
  var target = Server.DEFAULT_TARGET;
  req.session.target = target;
  req.session.token = token;
  req.session.timeRemaining = 0;

  res.status(402).jsonp({
    algorithm: 'sha256',
    target: target,
    token: token,
    timeRemaining: 0
  });
};

Server.prototype.processWork = function(req, res, next) {
  var nonce = req.header('x-nonce');
  var hash = this.sha256(req.session.token, nonce);
  if (hash < req.session.target) {
    req.session.nonce = nonce;
    req.session.timeRemaining = Server.DEFAULT_TIME;
    next();
  } else {
    this.requestWork(req, res);
  }
};

Server.prototype.spendTime = function(req, hrtime) {
  var spent = Math.round(hrtime[0] + (hrtime[1] / 1000000));
  var timeRemaining = req.session.timeRemaining - spent;
  if (timeRemaining <= 0) {
    req.session.token = null;
    req.session.nonce = null;
    req.session.timeRemaining = 0;
  } else {
    req.session.timeRemaining = timeRemaining;
  }
};

Server.prototype.workRequired = function() {
  var self = this;
  return function(req, res, next) {
    if (!req.session.timeRemaining) {
      if (req.header('x-nonce') && req.session.token) {
        self.processWork(req, res, next);
      } else {
        self.requestWork(req, res);
      }
    } else {
      req._startAt = process.hrtime();
      onHeaders(res, function() {
        self.spendTime(req, process.hrtime(req._startAt));
      });
      next();
    }
  };
};

Server.prototype.start = function(callback) {
  var self = this;

  self.app = express();

  self.httpServer = require('http').createServer(self.app);

  self.app.use(session({
    saveUninitialized: true,
    resave: false,
    secret: crypto.randomBytes(32).toString('hex'),
    cookie: {maxAge: 60 * 1000}
  }));

  self.app.get('/', this.workRequired(), function(req, res) {
    setTimeout(function() {
      res.send('Hello, world!');
    }, 2000);
  });

  self.httpServer.listen(self.port, function() {
    callback();
  });
};

Server.prototype.stop = function(callback) {
  this.httpServer.close(callback);
};

if (require.main === module) {
  var options = {};
  if (process.argv[2]) {
    options = JSON.parse(process.argv[2]);
  }
  var server = new Server(options);
  server.start(function(err) {
    if (err) {
      return console.log('Error starting server:', err);
    }
    console.log('Started server on port:', server.port);
  });
}

module.exports = Server;
