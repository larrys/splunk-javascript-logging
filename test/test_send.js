var SplunkLogger = require("../index").Logger;
var assert = require("assert");

/**
 * Load test configuration from test/config.json
 * It just needs a token:
 *
 *     {"token": "token-goes-here"}
 *
 */
var configurationFile = require("./config.json");

var successBody = {
    text: "Success",
    code: 0
};

var invalidTokenBody = {
    text: "Invalid token",
    code: 4
};

var noDataBody = {
    text: "No data",
    code: 5
};

var incorrectIndexBody = {
    text: "Incorrect index",
    code: 7,
    "invalid-event-number": 1
};

// Backup console.log so we can restore it later
var ___log = console.log;
/**
 * Silences console.log
 * Undo this effect by calling unmute().
 */
function mute() {
    console.log = function(){};
}

/**
 * Un-silences console.log
 */
function unmute() {
    console.log = ___log;
}


describe("SplunkLogger _makedata", function() {
    it("should error with no args", function() {
        try {
            SplunkLogger.prototype._makeBody();
            assert.ok(false, "Expected an error.");
        }
        catch(err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Context parameter is required.");
        }
    });
    it("should objectify data as string, with default severity", function() {
        var context = {
            data: "something"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.data);
        assert.strictEqual(body.event.severity, "info");
    });
    it("should objectify data as array, without severity param", function() {
        var context = {
            data: ["something"]
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.data);
        assert.strictEqual(body.event.severity, "info");
    });
    it("should objectify data as object, without severity param", function() {
        var context = {
            data: {
                prop: "something"
            }
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.data);
        assert.strictEqual(body.event.message.prop, "something");
        assert.strictEqual(body.event.severity, "info");
    });
    it("should objectify data as string, with severity param", function() {
        var context = {
            data: "something",
            severity: "urgent"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.data);
        assert.strictEqual(body.event.severity, "urgent");
    });
    it("should objectify data as array, with severity param", function() {
        var context = {
            data: ["something"],
            severity: "urgent"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.data);
        assert.strictEqual(body.event.severity, "urgent");
    });
    it("should objectify data as object, with severity param", function() {
        var context = {
            data: {
                prop: "something"
            },
            severity: "urgent"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.data);
        assert.strictEqual(body.event.message.prop, "something");
        assert.strictEqual(body.event.severity, "urgent");
    });
});
describe("SplunkLogger send", function() {
    describe("using default middleware (integration tests)", function () {
        it("should error with bad token", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, invalidTokenBody.text);
                assert.strictEqual(body.code, invalidTokenBody.code);
                done();
            });
        });
        it("should send without callback", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                config: config,
                data: data
            };

            assert.strictEqual(logger.contextQueue.length, 0);
            logger.send(context);
            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            }, 500);
        });
        it("should succeed with valid token", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                config: config,
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, using custom time", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                data: data,
                time: new Date("January 1, 2015")
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should error with valid token, sending to the wrong index", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                data: data,
                index: "_____bad___index______"
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, incorrectIndexBody.text);
                assert.strictEqual(body.code, incorrectIndexBody.code);
                assert.strictEqual(body["invalid-event-number"], incorrectIndexBody["invalid-event-number"]);
                done();
            });
        });
        // TODO: add a test successfully sending data to a different index (needs to be set during token creation)
        it("should succeed with valid token, changing source", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                data: data,
                source: "_____new____source"
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing sourcetype", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                data: data,
                sourcetype: "_____new____sourcetype"
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing host", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: logger.config,
                data: data,
                host: "some.other.host"
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with different valid token passed through context", function(done) {
            var config = {
                token: "invalid-token"
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            config.token = configurationFile.token;
            var context = {
                config: config,
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                config: config,
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed without token passed through context", function(done) {
            var config = {
                token: configurationFile.token
            };
            var logger = new SplunkLogger(config);

            assert.strictEqual(logger.config.token, config.token);

            var data = "something";

            var context = {
                config: {},
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should fail on wrong protocol (assumes HTTP is invalid)", function(done) {
            var config = {
                token: configurationFile.token,
                protocol: "http"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(err);
                assert.strictEqual(err.message, "socket hang up");
                assert.strictEqual(err.code, "ECONNRESET");
                done();
            });
        });
        it("should succeed with valid token, using non-default url", function(done) {
            var config = {
                token: configurationFile.token,
                url: "https://localhost:8088/services/collector/event/1.0"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should error with valid token, using strict SSL", function(done) {
            var config = {
                token: configurationFile.token,
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                data: data,
                requestOptions: {
                    strictSSL: true
                }
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(err);
                assert.strictEqual(err.message, "SELF_SIGNED_CERT_IN_CHAIN");
                assert.ok(!resp);
                assert.ok(!body);
                done();
            });
        });
        it("should send 2 events with valid token, w/o callbacks", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "batched event";
            var context = {
                config: config,
                data: data
            };
            
            var sent = 0;

            // Wrap sendevents to ensure it gets called
            logger._sendEvents = function(cont, cb) {
                sent++;
                SplunkLogger.prototype._sendEvents(cont, cb);
            };

            logger.send(context);
            logger.send(context);

            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(sent, 2);
                done();
            }, 1000);
        });
    });
    describe("using batching (integration tests)", function () {
        it("should get no data response when flushing empty batch with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                batching: "manual"
            };

            var logger = new SplunkLogger(config);

            assert.strictEqual(logger.contextQueue.length, 0);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, noDataBody.text);
                assert.strictEqual(body.code, noDataBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            });
        });
        it("should be noop when flushing empty batch, without callback, with valid token", function() {
            var config = {
                token: configurationFile.token,
                batching: "manual"
            };

            var logger = new SplunkLogger(config);

            // Nothing should be sent if queue is empty
            assert.strictEqual(logger.contextQueue.length, 0);
            logger.flush();
            assert.strictEqual(logger.contextQueue.length, 0);
        });
        it("should flush a batch of 1 event with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                batching: "manual"
            };

            var logger = new SplunkLogger(config);

            var data = "batched event 1";
            var context = {
                config: config,
                data: data
            };
        
            logger.send(context);

            assert.strictEqual(logger.contextQueue.length, 1);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            });
        });
        it("should flush a batch of 2 events with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                batching: "manual"
            };

            var logger = new SplunkLogger(config);

            var data = "batched event";
            var context = {
                config: config,
                data: data
            };

            logger.send(context);
            logger.send(context);

            assert.strictEqual(logger.contextQueue.length, 2);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            });
        });
    });
    describe("using custom middleware", function() {
        it("should error with non-function middleware", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };
            try {
                var logger = new SplunkLogger(config);
                logger.use("not a function");
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Middleware must be a function.");
            }
        });
        it("should succeed using non-default middleware", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "something");
                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            logger._sendEvents = function(context, next) {
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "something";
            var context = {
                config: config,
                data: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 1);
                done();
            });
        });
        it("should succeed using non-default middleware, without passing the context through", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "something");
                next(null);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context, initialContext);
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "something";
            var initialContext = {
                config: config,
                data: initialData
            };

            logger.send(initialContext, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 1);
                done();
            });
        });
        it("should succeed using 2 middlewares", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, callback) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet??hing");
                context.data = encodeURIComponent(context.data);
                callback(null, context);
            }

            function middleware2(context, callback) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet%3F%3Fhing");
                callback(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.data, "somet%3F%3Fhing");
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "somet??hing";
            var context = {
                config: config,
                data: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 2);
                done();
            });
        });
        it("should succeed using 3 middlewares", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet??hing");
                context.data = encodeURIComponent(context.data);
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet%3F%3Fhing");
                context.data = decodeURIComponent(context.data) + " changed";
                assert.strictEqual(context.data, "somet??hing changed");
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet??hing changed");
                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.data, "somet??hing changed");
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "somet??hing";
            var context = {
                config: config,
                data: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 3);
                done();
            });
        });
        it("should succeed using 3 middlewares with data object", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, initialData);

                assert.strictEqual(context.data.property, initialData.property);
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, initialData.number);
                assert.strictEqual(context.data.bool, initialData.bool);

                context.data.property = "new";
                context.data.bool = true;
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;
                
                assert.strictEqual(context.data.property, "new");
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, initialData.number);
                assert.strictEqual(context.data.bool, true);

                context.data.number = 789;
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;
                
                assert.strictEqual(context.data.property, "new");
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, 789);
                assert.strictEqual(context.data.bool, true);

                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.data.property, "new");
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, 789);
                assert.strictEqual(context.data.bool, true);

                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = {
                property: "one",
                nested: {
                    object: "value"
                },
                number: 1234,
                bool: false
            };
            var context = {
                config: config,
                data: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 3);
                done();
            });
        });
    });
    describe("error handlers", function() {
        it("should get error and context using default error handler, without passing context to next()", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "something");
                context.data = "something else";
                next(new Error("error!"));
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var initialContext = {
                config: config,
                data: initialData
            };

            var run = false;

            mute();

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err, context) {
                run = true;
                assert.ok(err);
                assert.ok(context);
                assert.strictEqual(err.message, "error!");
                initialContext.data = "something else";
                assert.strictEqual(context, initialContext);
                errCallback(err, context);
                
                unmute();
                done();
            };

            // Fire & forget, the callback won't be called anyways due to the error
            logger.send(initialContext);

            assert.ok(run);
            assert.strictEqual(middlewareCount, 1);
        });
        it("should get error and context using default error handler", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "something");
                context.data = "something else";
                next(new Error("error!"), context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var initialContext = {
                config: config,
                data: initialData
            };

            var run = false;

            mute();

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err, context) {
                run = true;
                assert.ok(err);
                assert.ok(context);
                assert.strictEqual(err.message, "error!");
                initialContext.data = "something else";
                assert.strictEqual(context, initialContext);
                errCallback(err, context);
                
                unmute();
                done();
            };

            // Fire & forget, the callback won't be called anyways due to the error
            logger.send(initialContext);

            assert.ok(run);
            assert.strictEqual(middlewareCount, 1);
        });
        it("should get error and context sending twice using default error handler", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "something");
                context.data = "something else";
                next(new Error("error!"), context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var context1 = {
                config: config,
                data: initialData
            };

            mute();

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.strictEqual(err.message, "error!");
                assert.ok(context);
                assert.strictEqual(context.data, "something else");

                var comparing = context1;
                if (middlewareCount === 2) {
                    comparing = context2;
                }
                assert.strictEqual(context.severity, comparing.severity);
                assert.strictEqual(context.config, comparing.config);
                assert.strictEqual(context.requestOptions, comparing.requestOptions);
                
                errCallback(err, context);
                if (middlewareCount === 2) {
                    unmute();
                    done();
                }
            };

            // Fire & forget, the callback won't be called anyways due to the error
            logger.send(context1);
            // Reset the data, hopefully this doesn't explode
            var context2 = JSON.parse(JSON.stringify(context1));
            context2.data = "something";
            logger.send(context2);

            assert.strictEqual(middlewareCount, 2);
        });
    });
});
