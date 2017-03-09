"use strict";

var path = require("path");
var http = require("http");
var fs = require("fs");
var Transform = require("stream").Transform;
var MSG404 = "404 page not found!";
var CODE404 = 404;
var INDEX_HTML = "index.html";
var INDEX_HTM = "index.htm";

if (!fs.constants){
  fs.constants = {
    R_OK: "R_OK",
  }
}

var liteDevServer = function liteDevServer(_ref) {
    var _ref$folder = _ref.folder,
        folder = _ref$folder === undefined ? "public" : _ref$folder,
        _ref$page = _ref.page404,
        page404 = _ref$page === undefined ? null : _ref$page,
        _ref$listen = _ref.listen,
        listen = _ref$listen === undefined ? 3000 : _ref$listen,
        _ref$liveReload = _ref.liveReload,
        liveReload = _ref$liveReload === undefined ? true : _ref$liveReload,
        _ref$webSocketPort = _ref.webSocketPort,
        webSocketPort = _ref$webSocketPort === undefined ? 8080 : _ref$webSocketPort,
        _ref$watchFolders = _ref.watchFolders,
        watchFolders = _ref$watchFolders === undefined ? ["public"] : _ref$watchFolders,
        _ref$autoInjectClient = _ref.autoInjectClientJS,
        autoInjectClientJS = _ref$autoInjectClient === undefined ? true : _ref$autoInjectClient,
        _ref$proxy = _ref.proxy,
        proxy = _ref$proxy === undefined ? [] : _ref$proxy,
        _ref$liveReloadDelay = _ref.liveReloadDelay,
        liveReloadDelay = _ref$liveReloadDelay === undefined ? 0 : _ref$liveReloadDelay;

    var clientScript = "!function(){if(WebSocket){var e=location.hostname||\"localhost\",o=new WebSocket(\"ws://\"+e+\":" + webSocketPort + "\");o.onopen=function(){console.log(\"lite-dev-server - The WebSocket connection is established successfully\"),o.onmessage=function(e){\"reload page\"===e.data&&setTimeout(function(){console.log(\"lite-dev-server - Change detected! Page will reload!\"),location.reload(!0)},100)}},o.onclose=function(){console.log(\"lite-dev-server - Connection lost! Need reload!\"),setInterval(function(){location.reload(!0)},1e3)}}else console.log(\"lite-dev-server - this browser don't support WebSocket!\")}();";
    var _transform = function _transform(chunk, enc, cb) {
        if (autoInjectClientJS) {
            var newChunk = (chunk + "").replace(/(<head>)/, "$1 \n<script>" + clientScript + "</script>");
            this.push(newChunk);
        } else this.push(chunk);
        cb();
    };
    if (liveReload) {
        var EventEmitter = require("events");
        var liveReloadEM = new EventEmitter();
        var ws = require("ws");
        var wss = new ws.Server({ port: webSocketPort });
        wss.on("connection", function (connection) {
            console.log("\nlite-dev-server: The WebSocket connection is established successfully");
            var reloadHandler = function reloadHandler() {
                connection.send("reload page");
            };
            liveReloadEM.on("reload", reloadHandler);
            connection.on("close", function () {
                liveReloadEM.removeListener("reload", reloadHandler);
            });
        });
        watchFolders = watchFolders.filter(function (folder) {
            try {
                fs.accessSync("" + folder);
                return true;
            } catch (err) {
                console.log(err + "");
                return false;
            }
        });
        console.log("\nwatchFolders", watchFolders);
        watchFolders.forEach(function (folder) {
            fs.watch("" + folder, { recursive: true }, function () {
                setTimeout(function () {
                    liveReloadEM.emit("reload");
                }, liveReloadDelay);
            });
        });
    }
    if (page404) try {
        fs.accessSync(folder + "/" + page404, fs.constants.R_OK);
    } catch (err) {
        console.log(err + "");
    }

    var server = http.createServer(function (req, res) {

        var matchedProxy = proxy.find(function (item) {
            var regExp = new RegExp("^/" + item.path + "(/.*)?$");
            return req.url.match(regExp) && item.host && item.port;
        });
        if (matchedProxy) {
            var options = {
                hostname: matchedProxy.host,
                port: matchedProxy.port,
                path: req.url,
                method: req.method,
                headers: req.headers
            };
            var request = http.request(options, function (_res) {
                res.writeHead(_res.statusCode, _res.headers);
                _res.pipe(res);
            });
            request.end();
        } else {
            var injectStream = new Transform();
            injectStream._transform = _transform;
            if (req.url === "/") {
                fs.access(folder + "/" + INDEX_HTML, fs.constants.R_OK, function (err) {
                    if (err) fs.access(folder + "/" + INDEX_HTM, fs.constants.R_OK, function (err) {
                        if (err) {
                            console.log(err + "");
                            res.statusCode = CODE404;
                            if (page404) fs.createReadStream(folder + "/" + page404).pipe(injectStream).pipe(res);else res.end(MSG404);
                        } else fs.createReadStream(folder + "/" + INDEX_HTM).pipe(injectStream).pipe(res);
                    });else fs.createReadStream(folder + "/" + INDEX_HTML).pipe(injectStream).pipe(res);
                });
            } else {
                fs.access("" + folder + req.url, fs.constants.R_OK, function (err) {
                    if (err) {
                        console.log(err + "");
                        res.statusCode = CODE404;
                        if (page404) fs.createReadStream(folder + "/" + page404).pipe(injectStream).pipe(res);else res.end(MSG404);
                    } else {
                        var ext = path.extname(req.url);
                        if (ext === ".html" || ext === ".htm") fs.createReadStream("" + folder + req.url).pipe(injectStream).pipe(res);else fs.createReadStream("" + folder + req.url).pipe(res);
                    }
                });
            }
        }
    });
    server.listen(listen);
    console.log("lite-dev-server listening on port " + listen);
};

module.exports = liteDevServer;
