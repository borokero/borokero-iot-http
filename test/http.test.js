/* eslint-env mocha */
/* global ponteSettings, expect */
const aedes = require("aedes");
var request = require("supertest");
var HTTP = require("../lib/http");

describe("HTTP API", function () {
  var instance;

  describe("without auth problems", function () {
    beforeEach(function (done) {
      instance = new HTTP(
        {
          brokero: aedes(),
          port: 3000,
        },
        done
      );
    });

    afterEach(function (done) {
      instance.close(done);
    });

    it("should GET an unknown topic and return a 404", function (done) {
      console.log("run #1");
      request(instance.server).get("/resources/hello").expect(404, done);
    });

    it("should PUT a topic and return a 204", function (done) {
      request(instance.server)
        .put("/resources/hello")
        .send("hello world")
        .expect(204, done);
    });

    it("should PUT a topic and return a Location header", function (done) {
      request(instance.server)
        .put("/resources/hello")
        .send("hello world")
        .expect("Location", "/resources/hello", done);
    });

    it("should PUT and GET a topic and its payload", function (done) {
      request(instance.server)
        .put("/resources/hello")
        .set("content-type", "text/plain")
        .send("hello world")
        .expect(204, function () {
          request(instance.server)
            .get("/resources/hello")
            .expect(200, "hello world", done);
        });
    });

    it("should POST and GET a topic and its payload", function (done) {
      request(instance.server)
        .post("/resources/hello")
        .set("content-type", "text/plain")
        .send("hello world")
        .expect(204, function () {
          request(instance.server)
            .get("/resources/hello")
            .expect(200, "hello world", done);
        });
    });

    /*
    it("should emit an 'retained' event after a put", function (done) {
      request(instance.server)
        .put("/resources/hello")
        .set("content-type", "text/plain")
        .send("hello world")
        .end(function () {});

      instance.on("retained", function (resource, value) {
        expect(resource).to.eql("hello");
        expect(value).to.eql(new Buffer("hello world"));
        done();
      });
    });

    */
    it("should GET the index and return a 404", function (done) {
      request(instance.server).get("").expect(404, done);
    });

    it("should handle CORS headers", function (done) {
      request(instance.server)
        .options("/resources/hello")
        .set("Origin", "http://somehost.org")
        .expect("Access-Control-Allow-Origin", "http://somehost.org")
        .expect(
          "Access-Control-Allow-Methods",
          "POST, GET, PUT, DELETE, OPTIONS, XMODIFY"
        )
        .expect("Access-Control-Max-Age", "86400")
        .expect(
          "Access-Control-Allow-Headers",
          "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
        )
        .expect(200, done);
    });
  });

  describe("with auth problems", function () {
    beforeEach(function (done) {
      settings = {
        brokero: aedes(),
        port: 3000,
      };

      settings.authenticate = function (req, callback) {
        if (req.url === "/resources/unauthenticated") {
          callback(null, false);
        } else {
          var subject = {};
          callback(null, true, subject);
        }
      };
      settings.authorizeGet = function (subject, topic, callback) {
        if (topic === "unauthorizedGet") {
          callback(null, false);
        } else {
          callback(null, true);
        }
      };
      settings.authorizePut = function (subject, topic, payload, callback) {
        if (topic === "unauthorizedPut") {
          callback(null, false);
        } else {
          callback(null, true);
        }
      };

      //instance = ponte(settings, done);
      instance = new HTTP(settings, done);
    });

    afterEach(function (done) {
      instance.close(done);
    });

    it("should return 401 if a request cannot be authenticated", function (done) {
      request(instance.server)
        .get("/resources/unauthenticated")
        .expect(401, done);
    });

    it("should return 403 if a GET request is not authorized", function (done) {
      request(instance.server)
        .get("/resources/unauthorizedGet")
        .expect(403, done);
    });

    it("should return 403 if a PUT request is not authorized", function (done) {
      request(instance.server)
        .put("/resources/unauthorizedPut")
        .set("content-type", "text/plain")
        .send("hello world")
        .expect(403, done);
    });
  });
});
