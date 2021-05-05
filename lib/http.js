/**
 * HTTP Module
 * @description This module handles the HTTP requests
 * @module
 */
var http = require("http");
const concat = require("concat-stream");
var resourcesRegexp = /^\/resources\/(.+)$/;
var callback = require("callback-stream");
var corsify = require("corsify");

function HTTP(opts, done) {
  if (!(this instanceof HTTP)) {
    return new HTTP(opts, done);
  }

  if (typeof opts === "function") {
    done = opts;
    opts = {};
  }

  var that = this;
  this._persistence = opts.brokero.persistence;
  this._brokero = opts.brokero;

  if (typeof opts.authenticate === "function") {
    this.authenticate = opts.authenticate;
  }

  if (typeof opts.authorizeGet === "function") {
    this.authorizeGet = opts.authorizeGet;
  }

  if (typeof opts.authorizePut === "function") {
    this.authorizePut = opts.authorizePut;
  }
  if (!opts.brokero.logger) opts.brokero.logger = console;

  var logger = (this._logger = opts.brokero.logger);
  this.server = http.createServer(this.buildServer(opts));
  this.server.listen(opts.port, opts.host, function (err) {
    logger.info({ port: opts.port }, "server started");
    done(err, that);
  });

  if (this._brokero.mqtt) {
    this._brokero.mqtt.attachHttpServer(this.server);
  }
}

HTTP.prototype.close = function (done) {
  this.server.close(done);
};

HTTP.prototype.buildServer = function (opts) {
  var logger = this._logger;
  var persistence = this._persistence;
  var brokero = this._brokero;

  var authenticate = this.authenticate;
  var authorizeGet = this.authorizeGet;
  var authorizePut = this.authorizePut;

  function handleAuthError(err, res) {
    logger.info(err);
    res.statusCode = 500;
    res.end();
  }

  function handleNotAuthenticated(res) {
    logger.info("authentication denied");
    res.statusCode = 401;
    res.end();
  }

  function handleNotAuthorized(res) {
    logger.info("not authorized");
    res.statusCode = 403;
    res.end();
  }

  function handleGetResource(subject, topic, req, res) {
    if (req.method !== "GET") {
      return false;
    }
    authorizeGet(subject, topic, function (err, authorized) {
      if (err) {
        handleAuthError(err, res);
        return;
      }

      if (!authorized) {
        handleNotAuthorized(res);
        return;
      }

      const lookup = persistence.createRetainedStream(topic);
      lookup.pipe(
        concat(function (packets) {
          if (packets.length === 0) {
            res.statusCode = 404;
            res.end("Not found");
          } else {
            res.end(packets[0].payload);
          }
          return true;
        })
      );
    });

    return true;
  }

  function handlePutResource(subject, topic, req, res) {
    if (req.method !== "PUT" && req.method !== "POST") {
      return false;
    }

    req.pipe(
      callback(function (err, payload) {
        if (err) {
          logger.error(err);
          return;
        }
        payload = payload[0];

        if (typeof payload === "undefined") {
          payload = "";
        }

        authorizePut(subject, topic, payload, function (err, authorized) {
          if (err) {
            handleAuthError(err, res);
            return;
          }

          if (!authorized) {
            handleNotAuthorized(res);
            return;
          }

          var packet = { topic: topic, payload: payload, retain: true };
          persistence.storeRetained(packet, function () {
            res.setHeader("Location", "/resources/" + topic);
            res.statusCode = 204;
            res.end();
            brokero.emit("retained", topic, new Buffer(payload));
          });
        });
      })
    );

    return true;
  }

  function handleNotFound(res) {
    res.writeHeader(404);
    res.end("Not Found");
  }

  return corsify(
    {
      endOptions: true,
    },
    function httpServer(req, res) {
      logger.info({ reqMethod: req.method });

      res.on("finish", function () {
        logger.info({ resStatusCode: res.statusCode });
      });

      // Only authenticate requests to the resources
      var match = req.url.match(resourcesRegexp);
      if (match) {
        var topic = match[1];
        authenticate(req, function (err, authenticated, subject) {
          if (err) {
            handleAuthError(err, res);
            return;
          }

          if (!authenticated) {
            handleNotAuthenticated(res);
            return;
          }

          var handled =
            handleGetResource(subject, topic, req, res) ||
            handlePutResource(subject, topic, req, res);

          if (!handled) {
            handleNotFound(res);
          }
        });
      } else
      handleNotFound(res);
    }
  );
};

/**
 * The function that will be used to authenticate requests.
 * This default implementation authenticates everybody.
 * The returned subject is just a new Object.
 *
 * @param {Object} req The request object
 * @param {Function} cb The callback function. Has the following structure: cb(err, authenticated, subject)
 */
HTTP.prototype.authenticate = function (req, cb) {
  cb(null, true, {});
};

/**
 * The function that will be used to authorize subjects to GET messages from topics.
 * This default implementation authorizes everybody.
 *
 * @param {Object} subject The subject returned by the authenticate function
 * @param {string} topic The topic
 * @param {Function} cb The callback function. Has the following structure: cb(err, authorized)
 */
HTTP.prototype.authorizeGet = function (subject, topic, cb) {
  cb(null, true);
};

/**
 * The function that will be used to authorize subjects to PUT messages to topics.
 * This default implementation authorizes everybody.
 *
 * @param {Object} subject The subject returned by the authenticate function
 * @param {string} topic The topic
 * @param {string} payload The payload
 * @param {Function} cb The callback function. Has the following structure: cb(err, authorized)
 */
HTTP.prototype.authorizePut = function (subject, topic, payload, cb) {
  cb(null, true);
};

module.exports = HTTP;